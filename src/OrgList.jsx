import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

export default function OrgList({ selectedOrgId, onSelectOrg, role }) {
    const { organizationId } = useAuth();
    const [structureList, setStructureList] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", id: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        if (!organizationId) return;
        const unsub = onSnapshot(
            collection(db, "organizations", organizationId, "orgStructures"),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStructureList(data);
            }
        );
        return () => unsub();
    }, [organizationId]);

    const filteredStructures = structureList.filter((s) =>
        s.name?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleAddStructure(e) {
        e.preventDefault();
        setError("");
        if (!form.name.trim() || !form.id.trim()) {
            setError("Both fields are required");
            toast.error("Both fields are required");
            return;
        }
        if (structureList.some((s) => s.id === form.id)) {
            setError("Structure ID already exists");
            toast.error("Structure ID already exists");
            return;
        }
        try {
            await setDoc(doc(db, "organizations", organizationId, "orgStructures", form.id.trim()), {
                name: form.name.trim(),
                id: form.id.trim()
            });
            setShowModal(false);
            setForm({ name: "", id: "" });
            setError("");
            toast.success("Organization structure added successfully!");
        } catch {
            setError("Failed to add structure");
            toast.error("Failed to add structure");
        }
    }

    return (
        <div className="bg-gray-900 shadow-md p-4 border-r border-gray-800 min-h-screen">
            <div className="flex items-center mb-4 gap-2">
                <input
                    className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="Search org structures..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {role === 'admin' && (
                    <button
                        className="bg-blue-700 text-white px-4 py-2 shadow hover:bg-blue-800 transition text-sm font-semibold"
                        onClick={() => setShowModal(true)}
                    >
                        +
                    </button>
                )}
            </div>
            <ul className="space-y-2">
                {filteredStructures.map((structure) => (
                    <li
                        key={structure.id}
                        className={`p-3 cursor-pointer border transition flex items-center gap-2 shadow-sm animate-slide-in-left ${selectedOrgId === structure.id
                            ? "bg-blue-900 border-blue-700 font-bold text-blue-200"
                            : "bg-gray-800 hover:bg-gray-700 border-gray-800 text-gray-100"
                            }`}
                        onClick={() => onSelectOrg(structure)}
                    >
                        <span className="truncate">{structure.name}</span>
                    </li>
                ))}
                {filteredStructures.length === 0 && (
                    <li className="text-gray-400 text-sm text-center py-4">No org structures found</li>
                )}
            </ul>
            {showModal && role === 'admin' && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <form
                        className="bg-gray-900 p-8 shadow-2xl w-96 border border-gray-700 animate-fade-in"
                        onSubmit={handleAddStructure}
                    >
                        <h3 className="font-bold text-lg mb-4 text-blue-300">Add Org Structure</h3>
                        <div className="space-y-3 mb-4">
                            <input
                                className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                placeholder="Structure Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <input
                                className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                placeholder="Structure ID (unique)"
                                value={form.id}
                                onChange={(e) => setForm({ ...form, id: e.target.value })}
                            />
                            {error && <div className="text-red-500 text-xs">{error}</div>}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
                                onClick={() => {
                                    setShowModal(false);
                                    setForm({ name: "", id: "" });
                                    setError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-700 text-white shadow hover:bg-blue-800 transition font-semibold"
                            >
                                Add
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
} 
