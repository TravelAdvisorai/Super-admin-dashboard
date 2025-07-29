import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc, setDoc, addDoc, deleteDoc, getDoc, query, where, writeBatch } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import OrganizationList from "./OrganizationList";
import StructureDetailsView from "./StructureDetailsView";
import TravelLogs from "./TravelLogs";
import { CreateOrgModal, CreateStructureModal, EditModal } from "./Modals";

// --- Data Deletion Logic ---

/**
 * Deletes all documents within known subcollections of a given document.
 * @param {DocumentReference} docRef The document reference whose subcollections will be deleted.
 */
async function deleteSubCollections(docRef) {
    const subcollections = ["employees", "config"];
    for (const sub of subcollections) {
        const subColRef = collection(docRef, sub);
        const snap = await getDocs(subColRef);
        for (const d of snap.docs) {
            await deleteDoc(d.ref);
        }
    }
}

/**
 * Deletes an entire organization, including its scattered data across different collections.
 */
async function handleDeleteOrg(orgId, setOrgs, setSelectedOrg, setStructures) {
    if (!window.confirm("DANGER: This will permanently delete the organization and ALL related structures, users, and travel logs. This cannot be undone. Are you sure?")) return;

    try {
        const batch = writeBatch(db);

        // 1. Delete users from the root user_directory
        const usersQuery = query(collection(db, "user_directory"), where("organizationId", "==", orgId));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.docs.forEach(d => batch.delete(d.ref));

        // 2. Delete travel requests from the root travelRequests collection
        const requestsQuery = query(collection(db, "travelRequests"), where("corporate.organizationId", "==", orgId));
        const requestsSnap = await getDocs(requestsQuery);
        requestsSnap.docs.forEach(d => batch.delete(d.ref));

        await batch.commit();

        // 3. Delete all structures and their subcollections (employees, config)
        const orgStructuresRef = collection(db, "organizations", orgId, "orgStructures");
        const structuresSnap = await getDocs(orgStructuresRef);
        for (const structureDoc of structuresSnap.docs) {
            await deleteSubCollections(structureDoc.ref);
            await deleteDoc(structureDoc.ref);
        }

        // 4. Delete the main organization document
        await deleteDoc(doc(db, "organizations", orgId));

        // 5. Update UI state
        setOrgs(orgs => orgs.filter(o => o.id !== orgId));
        setSelectedOrg("");
        setStructures([]);
        toast.success("Organization and all related data deleted.");
    } catch (error) {
        console.error("Failed to delete organization:", error);
        toast.error("An error occurred during organization deletion.");
    }
}

/**
 * Deletes a single organizational structure and its related data.
 */
async function handleDeleteStructure(orgId, structureId, setStructures, setSelectedStructure) {
    if (!window.confirm("Are you sure you want to delete this structure and all its employees and travel logs?")) return;
    try {
        const batch = writeBatch(db);
        const usersQuery = query(collection(db, "user_directory"), where("organizationId", "==", orgId), where("orgStructureId", "==", structureId));
        const usersSnap = await getDocs(usersQuery);
        usersSnap.docs.forEach(d => batch.delete(d.ref));
        const requestsQuery = query(collection(db, "travelRequests"), where("corporate.organizationId", "==", orgId), where("corporate.orgStructureId", "==", structureId));
        const requestsSnap = await getDocs(requestsQuery);
        requestsSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        const structureRef = doc(db, "organizations", orgId, "orgStructures", structureId);
        await deleteSubCollections(structureRef);
        await deleteDoc(structureRef);
        setStructures(structures => structures.filter(s => s.id !== structureId));
        setSelectedStructure(null);
        toast.success("Structure and related data deleted successfully.");
    } catch (error) {
        console.error("Failed to delete structure:", error);
        toast.error("An error occurred during structure deletion.");
    }
}


// --- Main Dashboard Component ---

export default function SuperAdminDashboard() {
    const { logout, user } = useAuth();

    // Data state
    const [orgs, setOrgs] = useState([]);
    const [structures, setStructures] = useState([]);

    // UI state
    const [selectedOrg, setSelectedOrg] = useState("");
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'logs'
    const [modal, setModal] = useState({ type: null, data: null });

    // --- Data Fetching ---
    useEffect(() => {
        const fetchOrgs = async () => {
            const snap = await getDocs(collection(db, "organizations"));
            setOrgs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchOrgs();
    }, []);

    useEffect(() => {
        if (!selectedOrg) {
            setStructures([]);
            return;
        }
        const fetchStructures = async () => {
            const snap = await getDocs(collection(db, "organizations", selectedOrg, "orgStructures"));
            setStructures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchStructures();
    }, [selectedOrg]);

    // --- Event Handlers ---
    const handleSaveEdit = async (newValue) => {
        const { type, data } = modal;
        const isOrg = type === 'edit_org';
        const docRef = isOrg
            ? doc(db, "organizations", data.id)
            : doc(db, "organizations", selectedOrg, "orgStructures", data.id);
        await updateDoc(docRef, { name: newValue });

        if (isOrg) {
            setOrgs(currentOrgs => currentOrgs.map(o => o.id === data.id ? { ...o, name: newValue } : o));
        } else {
            setStructures(currentStructures => currentStructures.map(s => s.id === data.id ? { ...s, name: newValue } : s));
        }
        toast.success(`${isOrg ? 'Organization' : 'Structure'} name updated.`);
        setModal({ type: null, data: null });
    };

    const handleCreateStructure = async (name) => {
        const newDocRef = await addDoc(collection(db, "organizations", selectedOrg, "orgStructures"), { name });
        setStructures(s => [...s, { id: newDocRef.id, name }]);
        toast.success("Structure created successfully.");
        setModal({ type: null, data: null });
    };
    
    const handleCreateOrg = async (name, id) => {
        const orgDocRef = doc(db, "organizations", id);
        if ((await getDoc(orgDocRef)).exists()) {
            toast.error("Organization ID already exists.");
            return Promise.reject("ID exists");
        }
        await setDoc(orgDocRef, { name });
        setOrgs(currentOrgs => [...currentOrgs, { id, name }]);
        setSelectedOrg(id);
        toast.success(`Organization "${name}" created successfully!`);
        setModal({ type: null, data: null });
    };

    // --- Render Logic ---
    if (view === 'logs' && selectedStructure) {
        return <TravelLogs organizationId={selectedOrg} orgStructure={selectedStructure} onBack={() => setView('dashboard')} />
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <div className="min-h-screen bg-gray-950 p-4 sm:p-8">
                <header className="flex flex-col sm:flex-row items-center justify-between mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-300 tracking-wide drop-shadow mb-4 sm:mb-0">
                        Super Admin Panel
                    </h1>
                    <div className="flex items-center gap-4">
                        {user && <span className="text-blue-200 font-semibold">{user.displayName}</span>}
                        <button className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded font-bold border border-blue-700 transition" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto bg-gray-900 rounded-xl shadow-2xl border-2 border-blue-900 p-4 sm:p-8">
                    <OrganizationList
                        orgs={orgs}
                        selectedOrgId={selectedOrg}
                        onSelectOrg={(orgId) => { setSelectedOrg(prev => prev === orgId ? "" : orgId); setSelectedStructure(null); }}
                        onDeleteOrg={(orgId) => handleDeleteOrg(orgId, setOrgs, setSelectedOrg, setStructures)}
                        onEditOrg={(org) => setModal({ type: 'edit_org', data: org })}
                        onAddNewOrg={() => setModal({ type: 'create_org' })}
                    />
                    {selectedOrg && (
                        <StructureDetailsView
                            orgId={selectedOrg}
                            orgName={orgs.find(o => o.id === selectedOrg)?.name}
                            structures={structures}
                            selectedStructure={selectedStructure}
                            user={user}
                            onSelectStructure={setSelectedStructure}
                            onAddNewStructure={() => setModal({ type: 'create_structure' })}
                            onEditStructure={(structure) => setModal({ type: 'edit_structure', data: structure })}
                            onDeleteStructure={(structureId) => handleDeleteStructure(selectedOrg, structureId, setStructures, setSelectedStructure)}
                            onViewLogs={() => setView('logs')}
                        />
                    )}
                </main>
            </div>
            
            <CreateOrgModal isOpen={modal.type === 'create_org'} onClose={() => setModal({ type: null })} onCreate={handleCreateOrg} />
            <CreateStructureModal isOpen={modal.type === 'create_structure'} onClose={() => setModal({ type: null })} onCreate={handleCreateStructure} />
            <EditModal isOpen={modal.type === 'edit_org' || modal.type === 'edit_structure'} onClose={() => setModal({ type: null })} onSave={handleSaveEdit} title={`Edit ${modal.type === 'edit_org' ? 'Organization' : 'Structure'}`} initialValue={modal.data?.name || ''} />
        </>
    );
}
