import React from "react";

export default function StructureListItem({ structure, orgId, setSelectedStructure, handleEditStructure, handleDeleteStructure, setStructures }) {
  return (
    <li className="flex flex-wrap items-center gap-2 w-full bg-gray-800/60 rounded-xl px-4 py-2 shadow hover:shadow-lg transition-all border border-gray-700 hover:border-blue-800">
      <span 
        className="text-blue-200 cursor-pointer underline font-semibold text-base hover:text-blue-400 transition-all" 
        onClick={() => setSelectedStructure(structure)}
      >
        {structure.name || structure.id}
      </span>
      <div className="flex-grow"></div>
      <div className="flex gap-2 items-center flex-wrap">
        <button 
          className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded font-bold border border-blue-700 hover:bg-blue-800" 
          onClick={() => handleEditStructure(structure)}
        >
          Edit
        </button>
        <button 
          className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded font-bold border border-red-700 hover:bg-red-800" 
          onClick={async () => await handleDeleteStructure(orgId, structure.id, setStructures, setSelectedStructure)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
