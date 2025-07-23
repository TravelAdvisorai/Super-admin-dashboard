import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, setDoc, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { toast } from 'react-toastify';
// Simple CSV parser
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });
        return obj;
    });
}

export default function EmployeeForm({ organizationId, orgStructure, role }) {
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", role: "employee" });
    const [error, setError] = useState("");
    const [editEmp, setEditEmp] = useState(null);

    useEffect(() => {
        if (!organizationId || !orgStructure || !orgStructure.id) return;
        setShowModal(false);
        setForm({ name: "", email: "", role: "employee" });
        setError("");
        setEditEmp(null);
        const unsub = onSnapshot(
            collection(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees"),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEmployees(data);
            }
        );
        return () => unsub();
    }, [organizationId, orgStructure]);

    if (!organizationId || !orgStructure || !orgStructure.id) {
        return null;
    }

    function openAddModal() {
        setForm({ name: "", email: "", role: "employee" });
        setEditEmp(null);
        setError("");
        setShowModal(true);
    }

    function openEditModal(emp) {
        setForm({
            name: emp.name || "",
            email: emp.email || emp.id || "",
            role: emp.role || "employee"
        });
        setEditEmp(emp);
        setError("");
        setShowModal(true);
    }

    async function handleAddOrEditEmployee(e) {
        e.preventDefault();
        setError("");
        if (!form.name.trim() || !form.email.trim()) {
            setError("Both fields are required");
            return;
        }
        try {
            if (editEmp) {
                // Edit: update name/email fields (not doc id)
                await updateDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", editEmp.id), {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    role: form.role || "employee"
                });
            } else {
                // Check if user already exists in /user_directory
                const userRef = doc(db, "user_directory", form.email.trim());
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    toast.error("A user with this email already exists.");
                    return;
                }
                // Add to /organizations/{organizationId}/orgStructures/{orgStructureId}/employees with email as doc ID
                await setDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", form.email.trim()), {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    role: form.role || "employee",
                    admin: false
                });
                // Add to /user_directory with email as doc ID
                await setDoc(doc(db, "user_directory", form.email.trim()), {
                    name: form.name.trim(),
                    email: form.email.trim(),
                    role: form.role || "employee",
                    organizationId: organizationId,
                    orgStructureId: orgStructure.id,
                    admin: false
                });
            }
            setShowModal(false);
            setForm({ name: "", email: "", role: "employee" });
            setEditEmp(null);
        } catch {
            setError("Failed to save employee");
        }
    }

    async function handleDeleteEmployee(empId) {
        if (!window.confirm("Are you sure you want to delete this employee?")) return;
        try {
            await deleteDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", empId));
            await deleteDoc(doc(db, "user_directory", empId));
        } catch {
            alert("Failed to delete employee");
        }
    }

    return (
        <div className="pt-4 px-6 pb-6">
            <div className="flex items-center justify-between mb-2">
                
                {role === 'admin' && (
                    <div className="flex gap-2">
                        <label className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 shadow cursor-pointer rounded">
                            Upload CSV
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const text = await file.text();
                                    let rows;
                                    try {
                                        rows = parseCSV(text);
                                    } catch {
                                        toast.error("Invalid CSV format");
                                        return;
                                    }
                                    let added = 0, skipped = 0;
                                    for (const row of rows) {
                                        const name = row.name?.trim();
                                        const email = row.email?.trim();
                                        const role = row.role?.trim() || "employee";
                                        if (!name || !email) { skipped++; continue; }
                                        // Check duplicate in user_directory
                                        const userRef = doc(db, "user_directory", email);
                                        const userSnap = await getDoc(userRef);
                                        if (userSnap.exists()) { skipped++; continue; }
                                        try {
                                            await setDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", email), {
                                                name, email, role, admin: false
                                            });
                                            await setDoc(doc(db, "user_directory", email), {
                                                name, email, role, organizationId: organizationId, orgStructureId: orgStructure.id, admin: false
                                            });
                                            added++;
                                        } catch {
                                            skipped++;
                                        }
                                    }
                                    toast.success(`Added ${added} employees. Skipped ${skipped}.`);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                        <button
                            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 shadow"
                            onClick={openAddModal}
                        >
                            Add Employee
                        </button>
                    </div>
                )}
            </div>
            <div className="overflow-x-auto border border-gray-700 bg-gray-900 shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="py-2 px-4 text-left font-semibold text-blue-300">Name</th>
                            <th className="py-2 px-4 text-left font-semibold text-blue-300">Email</th>
                            <th className="py-2 px-4 text-left font-semibold text-blue-300">Role</th>
                            <th className="py-2 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-800 transition">
                                <td className="py-2 px-4 text-gray-100">{emp.name || "No Name"}</td>
                                <td className="py-2 px-4 text-gray-100">{emp.email || emp.id || "No Email"}</td>
                                <td className="py-2 px-4 capitalize text-gray-100">{emp.role || "employee"}</td>
                                <td className="py-2 px-4 flex gap-2">
                                    {role === 'admin' && (
                                        <>
                                            <button
                                                className="text-xs text-blue-400 hover:underline"
                                                onClick={() => openEditModal(emp)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-xs text-red-400 hover:underline"
                                                onClick={() => handleDeleteEmployee(emp.id)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-400 py-4">
                                    No employees found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showModal && role === 'admin' && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <form
                        className="bg-gray-900 p-6 shadow-lg w-96 flex flex-col gap-4 border border-gray-700"
                        onSubmit={handleAddOrEditEmployee}
                    >
                        <h3 className="text-lg font-bold mb-2 text-blue-300">{editEmp ? "Edit Employee" : "Add Employee"}</h3>
                        <input
                            className="bg-gray-800 text-gray-100 p-2 border border-gray-700"
                            placeholder="Name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <input
                            className="bg-gray-800 text-gray-100 p-2 border border-gray-700"
                            placeholder="Email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        />
                        <select
                            className="bg-gray-800 text-gray-100 p-2 border border-gray-700"
                            value={form.role}
                            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                        >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="ceo">CEO</option>
                        </select>
                        {error && <div className="text-red-400 text-sm">{error}</div>}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2"
                                onClick={() => { setShowModal(false); setEditEmp(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2"
                            >
                                {editEmp ? "Save" : "Add"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
} 
