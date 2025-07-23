import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { toast } from 'react-toastify';

const DEFAULT_CONFIG = {
    approvalRequired: true,
    orgName: "",
};

export default function OrgDetails({ organizationId, orgStructure, onBack, role }) {
    const [config, setConfig] = useState({ ...DEFAULT_CONFIG, orgName: orgStructure.name });
    const [loading, setLoading] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Fetch config from Firestore when orgStructure changes
    useEffect(() => {
        let ignore = false;
        async function fetchConfig() {
            setLoading(true);
            try {
                const configRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "config", "main");
                const configSnap = await getDoc(configRef);
                if (!ignore) {
                    if (configSnap.exists()) {
                        setConfig({ ...DEFAULT_CONFIG, ...configSnap.data(), orgName: orgStructure.name });
                    } else {
                        setConfig({ ...DEFAULT_CONFIG, orgName: orgStructure.name });
                    }
                }
            } catch {
                if (!ignore) {
                    setConfig({ ...DEFAULT_CONFIG, orgName: orgStructure.name });
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        fetchConfig();
        return () => { ignore = true; };
    }, [organizationId, orgStructure]);

    function handleConfigChange(e) {
        const { name, value } = e.target;
        setConfig((prev) => ({
            ...prev,
            [name]: name === "approvalRequired" ? value === "true" : value,
        }));
    }

    async function handleSaveConfig(e) {
        e.preventDefault();
        setSavingConfig(true);
        try {
            const configRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "config", "main");
            await setDoc(configRef, {
                approvalRequired: config.approvalRequired,
                orgName: config.orgName
            });
            // Also update the orgStructure document's name
            const orgStructureDocRef = doc(db, "organizations", organizationId, "orgStructures", orgStructure.id);
            await updateDoc(orgStructureDocRef, { name: config.orgName });
            toast.success("Config updated successfully!");
            setShowConfigModal(false);
        } catch {
            toast.error("Failed to update config");
        } finally {
            setSavingConfig(false);
        }
    }

    async function handleDeleteOrgStructure() {
        if (deleteInput !== orgStructure.id) {
            toast.error("Org Structure ID does not match.");
            return;
        }
        setDeleting(true);
        try {
            // Delete all employees in /organizations/{organizationId}/orgStructures/{orgStructureId}/employees
            const employeesRef = collection(db, "organizations", organizationId, "orgStructures", orgStructure.id, "employees");
            const employeesSnap = await getDocs(employeesRef);
            const employeeDeletes = employeesSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
            await Promise.all(employeeDeletes);

            // Delete all users in /user_directory with organizationId and orgStructureId
            const usersRef = collection(db, "user_directory");
            const q = query(usersRef, where("organizationId", "==", organizationId), where("orgStructureId", "==", orgStructure.id));
            const usersSnap = await getDocs(q);
            const userDeletes = usersSnap.docs.map(docSnap => deleteDoc(docSnap.ref));
            await Promise.all(userDeletes);

            // Delete the orgStructure config doc
            await deleteDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "config", "main"));
            // Delete the orgStructure doc
            await deleteDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id));

            toast.success("Org Structure and all related users deleted.");
            setShowDeleteModal(false);
            setShowConfigModal(false);
            if (onBack) onBack();
        } catch {
            toast.error("Failed to delete org structure.");
        } finally {
            setDeleting(false);
            setDeleteInput("");
        }
    }

    if (loading) {
        return <div className="p-10 text-gray-400">Loading org structure config...</div>;
    }

    return (
        <div className="w-full flex flex-col gap-8 p-10 bg-gray-900 shadow-md border border-gray-800">
            <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl font-extrabold text-blue-500 flex items-center gap-2 mb-0">
                    <span className="inline-block w-3 h-3 bg-blue-700"></span>
                    {config.orgName || orgStructure.name}
                </h2>
                {role === 'admin' && (
                    <button
                        className="ml-auto px-4 py-1 bg-blue-700 text-white shadow hover:bg-blue-800 transition text-sm font-semibold"
                        onClick={() => setShowConfigModal(true)}
                    >
                        Config
                    </button>
                )}
                {onBack && (
                    <button
                        className="px-4 py-1 bg-gray-800 text-gray-200 shadow hover:bg-gray-700 transition text-sm font-semibold"
                        onClick={onBack}
                    >
                        Back
                    </button>
                )}
            </div>
            <div className="mb-2 text-gray-400 text-sm">
                <span className="font-semibold text-blue-400">Org Structure ID:</span> {orgStructure.id}
            </div>

            {/* Config Modal */}
            {showConfigModal && role === 'admin' && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in">
                    <form
                        onSubmit={handleSaveConfig}
                        className="bg-gray-900 p-8 shadow-2xl w-96 border border-gray-700 animate-fade-in"
                    >
                        <h3 className="font-bold text-lg mb-4 text-blue-300">Edit Org Structure Config</h3>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-300 mb-1">Org Structure Name</label>
                                <input
                                    className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                    name="orgName"
                                    value={config.orgName}
                                    onChange={handleConfigChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-300 mb-1">Approval Required</label>
                                <select
                                    className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-900"
                                    name="approvalRequired"
                                    value={config.approvalRequired ? "true" : "false"}
                                    onChange={handleConfigChange}
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between gap-2 mt-4">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
                                onClick={() => setShowConfigModal(false)}
                                disabled={savingConfig}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 transition font-semibold"
                                onClick={() => setShowDeleteModal(true)}
                                disabled={savingConfig}
                            >
                                Delete Org Structure
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-700 text-white shadow hover:bg-blue-800 transition font-semibold disabled:opacity-60"
                                disabled={savingConfig}
                            >
                                {savingConfig ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && role === 'admin' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-900 p-8 shadow-2xl w-96 border border-gray-700 animate-fade-in">
                        <h3 className="font-bold text-lg mb-4 text-red-400">Delete Org Structure</h3>
                        <p className="mb-4 text-gray-300">To confirm deletion, enter the org structure ID: <span className="font-mono text-blue-300">{orgStructure.id}</span></p>
                        <input
                            className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 mb-4"
                            placeholder="Enter org structure ID to confirm"
                            value={deleteInput}
                            onChange={e => setDeleteInput(e.target.value)}
                            disabled={deleting}
                        />
                        <div className="flex justify-between gap-2 mt-4">
                            <button
                                className="px-4 py-2 bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
                                onClick={() => { setShowDeleteModal(false); setDeleteInput(""); }}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 transition font-semibold"
                                onClick={handleDeleteOrgStructure}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 