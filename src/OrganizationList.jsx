import React from "react";

export default function OrganizationList({ orgs, selectedOrgId, onSelectOrg, onDeleteOrg, onEditOrg, onAddNewOrg }) {
    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-200">Organization Management</h2>
                <button
                    className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded font-bold border border-blue-700 transition"
                    onClick={onAddNewOrg}
                >
                    + New Organization
                </button>
            </div>
            <ul className="space-y-4">
                {orgs.map(org => (
                    <li key={org.id} className="bg-gray-800 rounded-xl p-4 shadow flex flex-col border border-blue-900">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer group" onClick={() => onSelectOrg(org.id)}>
                            <span className="font-semibold text-blue-200 text-lg mb-2 sm:mb-0">{org.name || org.id}</span>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button className="flex-1 text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded font-bold border border-blue-700 hover:bg-blue-800" onClick={e => { e.stopPropagation(); onEditOrg(org); }}>Edit Name</button>
                                <button className="flex-1 text-xs bg-red-900 text-red-200 px-3 py-1 rounded font-bold border border-red-700 hover:bg-red-800" onClick={e => { e.stopPropagation(); onDeleteOrg(org.id); }}>Delete Org</button>
                                <span className="ml-2 text-blue-400 text-lg">{selectedOrgId === org.id ? '▼' : '▶'}</span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}