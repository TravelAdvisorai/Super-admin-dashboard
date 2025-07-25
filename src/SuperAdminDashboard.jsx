import React, { useState, useEffect } from "react";
import StructureListItem from "./StructureListItem";
import { useAuth } from "./AuthContext";
import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc, setDoc, addDoc, deleteDoc, getDoc } from "firebase/firestore";
// Recursively delete all subcollections and documents for a given docRef
async function deleteCollectionRecursive(colRef) {
  const snap = await getDocs(colRef);
  for (const d of snap.docs) {
    // Delete subcollections first
    const subcollections = ["employees", "orgStructures"];
    for (const sub of subcollections) {
      try {
        await deleteCollectionRecursive(collection(d.ref, sub));
      } catch {}
    }
    await deleteDoc(d.ref);
  }
}

async function handleDeleteOrg(orgId, setOrgs, setSelectedOrg, setStructures) {
  if (!window.confirm("Are you sure you want to delete this organization and all its data?")) return;
  // Delete all orgStructures and their subcollections
  await deleteCollectionRecursive(collection(db, "organizations", orgId, "orgStructures"));
  // Delete the org doc
  await deleteDoc(doc(db, "organizations", orgId));
  setOrgs(orgs => orgs.filter(o => o.id !== orgId));
  setSelectedOrg("");
  setStructures([]);
}

async function handleDeleteStructure(orgId, structureId, setStructures, setSelectedStructure) {
  if (!window.confirm("Are you sure you want to delete this structure and all its employees?")) return;
  // Delete all employees in this structure
  await deleteCollectionRecursive(collection(db, "organizations", orgId, "orgStructures", structureId, "employees"));
  // Delete the structure doc
  await deleteDoc(doc(db, "organizations", orgId, "orgStructures", structureId));
  setStructures(structures => structures.filter(s => s.id !== structureId));
  setSelectedStructure(null);
}
import OrgDetails from "./OrgDetails";
import EmployeeForm from "./EmployeeForm";
import TravelLogs from "./TravelLogs";

export default function SuperAdminDashboard() {
  const { logout, user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgId, setNewOrgId] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [showCreateStructureModal, setShowCreateStructureModal] = useState(false);
  const [newStructureName, setNewStructureName] = useState("");
  const [creatingStructure, setCreatingStructure] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [structures, setStructures] = useState([]);
  // const [selectedStructure, setSelectedStructure] = useState("");
  const [orgEdit, setOrgEdit] = useState(null);
  const [orgEditName, setOrgEditName] = useState("");
  const [structureEdit, setStructureEdit] = useState(null);
  const [structureEditName, setStructureEditName] = useState("");
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [activeStructureTab, setActiveStructureTab] = useState("employees");

  // Fetch all organizations
  useEffect(() => {
    async function fetchOrgs() {
      const snap = await getDocs(collection(db, "organizations"));
      setOrgs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchOrgs();
  }, []);

  // Fetch org structures for selected org
  useEffect(() => {
    if (!selectedOrg) return setStructures([]);
    async function fetchStructures() {
      const snap = await getDocs(collection(db, "organizations", selectedOrg, "orgStructures"));
      setStructures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchStructures();
  }, [selectedOrg]);

  // Edit org name
  const handleEditOrg = (org) => {
    setOrgEdit(org);
    setOrgEditName(org.name || org.id);
    setShowOrgModal("org");
  };
  const handleSaveOrgEdit = async () => {
    setSaving(true);
    await updateDoc(doc(db, "organizations", orgEdit.id), { name: orgEditName });
    setOrgs(orgs => orgs.map(o => o.id === orgEdit.id ? { ...o, name: orgEditName } : o));
    setShowOrgModal(false);
    setSaving(false);
  };
  // Edit org structure name
  const handleEditStructure = (structure) => {
    setStructureEdit(structure);
    setStructureEditName(structure.name || structure.id);
    setShowOrgModal("structure");
  };
  const handleSaveStructureEdit = async () => {
    setSaving(true);
    await updateDoc(doc(db, "organizations", selectedOrg, "orgStructures", structureEdit.id), { name: structureEditName });
    setStructures(structures => structures.map(s => s.id === structureEdit.id ? { ...s, name: structureEditName } : s));
    setShowOrgModal(false);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-blue-300 tracking-wide drop-shadow">Super Admin Panel</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-blue-200 font-semibold">{user.displayName}</span>
          )}
          <button
            className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded font-bold border border-blue-700 transition"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto bg-gray-900 rounded-xl shadow-2xl border-2 border-blue-900 p-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-blue-200">Organization Management</h2>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-blue-400 text-lg">All Organizations</h3>
              <button
                className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded font-bold border border-blue-700 transition"
                onClick={() => { setShowCreateOrgModal(true); setNewOrgName(""); setNewOrgId(""); }}
              >
                + New Organization
              </button>
            </div>
            <ul className="space-y-4">
              {orgs.map(org => (
                <li key={org.id} className="bg-gray-800 rounded-xl p-4 shadow flex flex-col mb-4 border border-blue-900">
                  <div className="flex items-center justify-between cursor-pointer group" onClick={() => {
                    if (selectedOrg === org.id) {
                      setSelectedOrg('');
                      setSelectedStructure(null);
                    } else {
                      setSelectedOrg(org.id);
                      setSelectedStructure(null);
                    }
                  }}>
                    <span className="font-semibold text-blue-200 text-lg">{org.name || org.id}</span>
                    <div className="flex items-center gap-2">
                      <button className="text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded font-bold border border-blue-700 hover:bg-blue-800" onClick={e => { e.stopPropagation(); handleEditOrg(org); }}>Edit Org</button>
                      <button className="text-xs bg-red-900 text-red-200 px-3 py-1 rounded font-bold border border-red-700 hover:bg-red-800" onClick={async e => { e.stopPropagation(); await handleDeleteOrg(org.id, setOrgs, setSelectedOrg, setStructures); }}>Delete Org</button>
                    <span className="ml-2 text-blue-400 text-lg">{selectedOrg === org.id ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  {/* Org details and admin panel */}
                  {selectedOrg === org.id && (
                    <div className="bg-gray-950 border-2 border-blue-900 rounded-xl mt-4 p-6">
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-blue-300 mb-2">Organization Details</h4>
                        <div className="text-blue-100">
                          <div><span className="font-semibold">ID:</span> {org.id}</div>
                          <div><span className="font-semibold">Name:</span> {org.name || org.id}</div>
                          {org.address && <div><span className="font-semibold">Address:</span> {org.address}</div>}
                          {org.email && <div><span className="font-semibold">Email:</span> {org.email}</div>}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-bold text-blue-400">Structures:</h4>
                          <button
                            className="text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded font-bold border border-blue-700 hover:bg-blue-800"
                            onClick={() => { setShowCreateStructureModal(true); setNewStructureName(""); }}
                          >
                            + New Structure
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {structures.length > 0 ? structures.map(s => (
                            <StructureListItem
                              key={s.id}
                              structure={s}
                              orgId={org.id}
                              setSelectedStructure={setSelectedStructure}
                              setActiveStructureTab={setActiveStructureTab}
                              handleEditStructure={handleEditStructure}
                              handleDeleteStructure={handleDeleteStructure}
                              setStructures={setStructures}
                            />
                          )) : (
                            <li className="text-blue-400 text-xs">No structures found</li>
                          )}
                        </ul>
                      </div>
      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md relative border-2 border-blue-900">
            <button className="absolute top-2 right-4 text-blue-400 hover:text-red-500 text-2xl" onClick={() => setShowCreateOrgModal(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4 text-blue-300">Create New Organization</h3>
            <input
              className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
              placeholder="Organization ID (unique, no spaces)"
              value={newOrgId}
              onChange={e => setNewOrgId(e.target.value.replace(/\s/g, ''))}
              disabled={creatingOrg}
            />
            <input
              className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
              placeholder="Organization Name"
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              disabled={creatingOrg}
            />
            <button
              className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded w-full font-semibold transition border border-blue-700"
              onClick={async () => {
    if (!newOrgId || !newOrgName) {
      setOrgError("Both Organization ID and Name are required.");
      return;
    }
    if (/\s/.test(newOrgId)) {
      setOrgError("Organization ID cannot contain spaces.");
      return;
    }
    setCreatingOrg(true);
    try {
      // ADDED: Create a reference to the document location.
      const orgDocRef = doc(db, "organizations", newOrgId);
      
      // ADDED: Fetch the document snapshot to check if it exists.
      const orgDocSnap = await getDoc(orgDocRef);

      // ADDED: If the document exists, set an error and stop the process.
      if (orgDocSnap.exists()) {
        setOrgError("Organization ID already exists. Please use a unique ID.");
        return; // Stop the function here
      }

      // If the ID is unique, proceed to create the new organization
      // Note: We reuse orgDocRef from the check above.
      await setDoc(orgDocRef, { name: newOrgName });
      
      // Reload orgs from Firestore to ensure consistency
      const snap = await getDocs(collection(db, "organizations"));
      setOrgs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setShowCreateOrgModal(false);
      setSelectedOrg(newOrgId); // Auto-select new org
      setStructures([]); // Reset structures for new org
      setOrgError("");
    } catch (err) {
      console.error("Failed to create organization:", err);
      setOrgError("Failed to create organization: " + (err && err.message ? err.message : err));
    } finally {
      // ADDED: This block now correctly handles resetting the loading state
      // even if we exit early from the uniqueness check.
      setCreatingOrg(false);
    }
  }}
              disabled={creatingOrg || !newOrgId || !newOrgName}
            >
              {creatingOrg ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </div>
      )}

      {/* Create Structure Modal */}
      {showCreateStructureModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md relative border-2 border-blue-900">
            <button className="absolute top-2 right-4 text-blue-400 hover:text-red-500 text-2xl" onClick={() => setShowCreateStructureModal(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4 text-blue-300">Create New Structure</h3>
            <input
              className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
              placeholder="Structure Name"
              value={newStructureName}
              onChange={e => setNewStructureName(e.target.value)}
              disabled={creatingStructure}
            />
            <button
              className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded w-full font-semibold transition border border-blue-700"
              onClick={async () => {
                if (!newStructureName) return;
                setCreatingStructure(true);
                await addDoc(collection(db, "organizations", selectedOrg, "orgStructures"), { name: newStructureName });
                // Refresh structures from Firestore
                const snap = await getDocs(collection(db, "organizations", selectedOrg, "orgStructures"));
                setStructures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setShowCreateStructureModal(false);
                setCreatingStructure(false);
              }}
              disabled={creatingStructure || !newStructureName}
            >
              {creatingStructure ? 'Creating...' : 'Create Structure'}
            </button>
          </div>
        </div>
      )}
                      {/* Org admin functionalities for selected structure */}
                      {selectedStructure && selectedStructure.id && (
                        <div className="bg-gray-900 border border-blue-900 rounded p-4 mt-4">
                          <OrgDetails organizationId={org.id} orgStructure={selectedStructure} role={user && user.superadmin ? "superadmin" : "admin"} />
                          <div className="flex gap-4 my-4">
                            <button
                              className={`px-4 py-2 rounded font-bold border transition ${activeStructureTab === "employees" ? "bg-blue-700 text-white border-blue-500" : "bg-gray-800 text-blue-200 border-blue-900"}`}
                              onClick={() => setActiveStructureTab("employees")}
                            >
                              Employees
                            </button>
                            <button
                              className={`px-4 py-2 rounded font-bold border transition ${activeStructureTab === "travellogs" ? "bg-blue-700 text-white border-blue-500" : "bg-gray-800 text-blue-200 border-blue-900"}`}
                              onClick={() => setActiveStructureTab("travellogs")}
                            >
                              Travel Logs
                            </button>
                          </div>
                          {activeStructureTab === "employees" && (
                            <div className="my-8 bg-gray-950 border-2 border-blue-900 rounded-xl p-6 w-full">
                              <h3 className="text-2xl font-extrabold text-blue-300 mb-6">Employees</h3>
                              <EmployeeForm organizationId={org.id} orgStructure={selectedStructure} role={user && user.superadmin ? "superadmin" : "admin"} />
                            </div>
                          )}
                          {activeStructureTab === "travellogs" && (
                            <TravelLogs organizationId={org.id} orgStructure={selectedStructure} role={user && user.superadmin ? "superadmin" : "admin"} onBack={() => setSelectedStructure(null)} />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      {/* Org/Structure Edit Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md relative border-2 border-blue-900">
            <button className="absolute top-2 right-4 text-blue-400 hover:text-red-500 text-2xl" onClick={() => setShowOrgModal(false)}>&times;</button>
            <h3 className="text-lg font-bold mb-4 text-blue-300">Edit {showOrgModal === 'org' ? 'Organization' : 'Structure'}</h3>
            <input
              className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
              value={showOrgModal === 'org' ? orgEditName : structureEditName}
              onChange={e => showOrgModal === 'org' ? setOrgEditName(e.target.value) : setStructureEditName(e.target.value)}
            />
            <button
              className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded w-full font-semibold transition border border-blue-700"
              onClick={showOrgModal === 'org' ? handleSaveOrgEdit : handleSaveStructureEdit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
