import React from "react";
import StructureListItem from "./StructureListItem";
import OrgDetails from "./OrgDetails";
import EmployeeForm from "./EmployeeForm";

export default function StructureDetailsView({
    orgId,
    orgName,
    structures,
    selectedStructure,
    user,
    onSelectStructure,
    onAddNewStructure,
    onEditStructure,
    onDeleteStructure,
    onViewLogs
}) {
    return (
        <div className="bg-gray-950 border-2 border-blue-900 rounded-xl mt-4 p-4 sm:p-6">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-blue-300 mb-2">Details for: {orgName || orgId}</h3>
            </div>
            <div className="mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                    <h4 className="text-md font-bold text-blue-400 mb-2 sm:mb-0">Structures:</h4>
                    <button
                        className="text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded font-bold border border-blue-700 hover:bg-blue-800 w-full sm:w-auto"
                        onClick={onAddNewStructure}
                    >
                        + New Structure
                    </button>
                </div>
                <ul className="space-y-1">
                    {structures.length > 0 ? (
                        structures.map(s => (
                            <StructureListItem
                                key={s.id}
                                structure={s}
                                orgId={orgId}
                                setSelectedStructure={onSelectStructure}
                                handleEditStructure={onEditStructure}
                                handleDeleteStructure={() => onDeleteStructure(s.id)}
                            />
                        ))
                    ) : (
                        <li className="text-blue-400 text-xs">No structures found for this organization.</li>
                    )}
                </ul>
            </div>

            {selectedStructure && (
                <div className="bg-gray-900 border border-blue-900 rounded p-4 mt-4 space-y-6">
                    <OrgDetails
                        organizationId={orgId}
                        orgStructure={selectedStructure}
                        role={user && user.superadmin ? "superadmin" : "admin"}
                    />
                    <div className="flex justify-end">
                        <button className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-semibold" onClick={onViewLogs}>
                            View Travel Logs
                        </button>
                    </div>
                    <div className="my-8 bg-gray-950 border-2 border-blue-900 rounded-xl p-4 sm:p-6 w-full">
                        <h3 className="text-2xl font-extrabold text-blue-300 mb-6">Employees</h3>
                        <EmployeeForm
                            organizationId={orgId}
                            orgStructure={selectedStructure}
                            role={user && user.superadmin ? "superadmin" : "admin"}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}