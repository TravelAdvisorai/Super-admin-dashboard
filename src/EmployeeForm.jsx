import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, setDoc, onSnapshot, doc, deleteDoc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import { toast } from "react-toastify";

// Simple CSV parser (remains unchanged)
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
    const [editEmp, setEditEmp] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to subscribe to employee data for the selected structure
    useEffect(() => {
        if (!organizationId || !orgStructure?.id) return;
        
        const unsub = onSnapshot(
            collection(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees"),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEmployees(data);
            }
        );
        return () => unsub(); // Cleanup subscription on component unmount or dependency change
    }, [organizationId, orgStructure]);

    // Helper to close the modal and reset form state
    const closeModal = () => {
        setShowModal(false);
        setEditEmp(null);
        setForm({ name: "", email: "", role: "employee" });
    };
    
    // Handlers to open the modal for adding or editing
    const openAddModal = () => {
        setEditEmp(null);
        setForm({ name: "", email: "", role: "employee" });
        setShowModal(true);
    };

    const openEditModal = (emp) => {
        setEditEmp(emp);
        setForm({ name: emp.name || "", email: emp.email || emp.id, role: emp.role || "employee" });
        setShowModal(true);
    };

    // Centralized function to handle form submission for both add and edit
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) {
            toast.warn("Both name and email are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            if (editEmp) { // Logic for editing an existing employee
                const empRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", editEmp.id);
                await updateDoc(empRef, { name: form.name.trim(), email: form.email.trim(), role: form.role });
                toast.success("Employee updated successfully.");
            } else { // Logic for adding a new employee
                const userRef = doc(db, "user_directory", form.email.trim());
                if ((await getDoc(userRef)).exists()) {
                    toast.error("A user with this email already exists.");
                    return;
                }
                const batch = writeBatch(db);
                const employeePayload = { name: form.name.trim(), email: form.email.trim(), role: form.role, admin: false };
                
                // Add to organization's employee list
                const orgEmpRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", employeePayload.email);
                batch.set(orgEmpRef, employeePayload);
                
                // Add to global user directory
                const userDirRef = doc(db, "user_directory", employeePayload.email);
                batch.set(userDirRef, { ...employeePayload, organizationId, orgStructureId: orgStructure.id });
                
                await batch.commit();
                toast.success("Employee added successfully.");
            }
            closeModal();
        } catch (error) {
            console.error("Failed to save employee:", error);
            toast.error("Failed to save employee. See console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for deleting an employee
    const handleDeleteEmployee = async (empId, empEmail) => {
        if (!window.confirm("Are you sure you want to delete this employee?")) return;
        try {
            const batch = writeBatch(db);
            // Delete from organization
            const orgEmpRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", empId);
            batch.delete(orgEmpRef);
            
            // Delete from global user directory
            const userDirRef = doc(db, "user_directory", empEmail);
            batch.delete(userDirRef);

            await batch.commit();
            toast.success("Employee deleted.");
        } catch (error) {
            console.error("Failed to delete employee:", error);
            toast.error("Failed to delete employee. See console for details.");
        }
    };

    // Handler for processing a CSV upload
    const handleCsvUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsSubmitting(true);
        try {
            const text = await file.text();
            const rows = parseCSV(text);
            const batch = writeBatch(db);
            let added = 0, skipped = 0;

            for (const row of rows) {
                const name = row.name?.trim();
                const email = row.email?.trim();
                if (!name || !email) {
                    skipped++;
                    continue;
                }
                if ((await getDoc(doc(db, "user_directory", email))).exists()) {
                    skipped++;
                    continue;
                }
                const employeePayload = { name, email, role: row.role?.trim() || "employee", admin: false };
                
                const orgEmpRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees", email);
                batch.set(orgEmpRef, employeePayload);

                const userDirRef = doc(db, "user_directory", email);
                batch.set(userDirRef, { ...employeePayload, organizationId, orgStructureId: orgStructure.id });

                added++;
            }
            if(added > 0) await batch.commit();
            toast.success(`Added ${added} new employees. Skipped ${skipped} (invalid or existing).`);
        } catch (error) {
            console.error("CSV Upload Failed:", error);
            toast.error("CSV Upload Failed. Please check the file format and console for errors.");
        } finally {
            e.target.value = ""; // Reset file input
            setIsSubmitting(false);
        }
    };

    if (!organizationId || !orgStructure?.id) return null;

    return (
        <div className="pt-4 px-2 sm:px-6 pb-6">
            {role === 'admin' && (
                <div className="flex flex-col sm:flex-row items-center justify-between mb-2">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <label className={`bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 shadow cursor-pointer rounded text-center ${isSubmitting ? 'opacity-50' : ''}`}>
                            Upload CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={isSubmitting} />
                        </label>
                        <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 shadow rounded" onClick={openAddModal} disabled={isSubmitting}>
                            Add Employee
                        </button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto border border-gray-700 bg-gray-900 shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="py-2 px-4 text-left font-semibold text-blue-300">Name</th>
                            <th className="py-2 px-4 text-left font-semibold text-blue-300">Email</th>
                            <th className="py-2 px-4 text-left font-semibold text-blue-300">Role</th>
                            {role === 'admin' && <th className="py-2 px-4 text-left font-semibold text-blue-300">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-800 transition">
                                <td className="py-2 px-4 text-gray-100 break-words">{emp.name}</td>
                                <td className="py-2 px-4 text-gray-100 break-words">{emp.email}</td>
                                <td className="py-2 px-4 capitalize text-gray-100">{emp.role}</td>
                                {role === 'admin' && (
                                    <td className="py-2 px-4 flex gap-2">
                                        <button className="text-xs text-blue-400 hover:underline" onClick={() => openEditModal(emp)}>Edit</button>
                                        <button className="text-xs text-red-400 hover:underline" onClick={() => handleDeleteEmployee(emp.id, emp.email)}>Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr><td colSpan={role === 'admin' ? 4 : 3} className="text-center text-gray-400 py-4">No employees found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <form className="bg-gray-900 p-6 shadow-lg w-full max-w-md flex flex-col gap-4 border border-gray-700" onSubmit={handleFormSubmit}>
                        <h3 className="text-lg font-bold mb-2 text-blue-300">{editEmp ? "Edit Employee" : "Add Employee"}</h3>
                        <input className="bg-gray-800 text-gray-100 p-2 border border-gray-700" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        <input type="email" className="bg-gray-800 text-gray-100 p-2 border border-gray-700" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editEmp} required />
                        <select className="bg-gray-800 text-gray-100 p-2 border border-gray-700" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="ceo">CEO</option>
                        </select>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <button type="button" className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 order-2 sm:order-1" onClick={closeModal} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 order-1 sm:order-2" disabled={isSubmitting}>{isSubmitting ? "Saving..." : (editEmp ? "Save" : "Add")}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
