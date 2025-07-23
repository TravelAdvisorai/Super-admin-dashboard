import React, { useState, useRef, useEffect } from "react";

export default function StructureListItem({ structure, orgId, setSelectedStructure, setActiveStructureTab, handleEditStructure, handleDeleteStructure, setStructures }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <li className="flex items-center gap-2 w-full bg-gray-800/60 rounded-xl px-4 py-2 shadow hover:shadow-lg transition-all border border-blue-100">
      <span className="text-blue-200 cursor-pointer underline font-semibold text-base hover:text-blue-400 transition-all" onClick={() => { setSelectedStructure(structure); setActiveStructureTab('employees'); }}>{structure.name || structure.id}</span>
      <button className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded font-bold border border-blue-700 hover:bg-blue-800" onClick={() => handleEditStructure(structure)}>Edit</button>
      <div className="relative" ref={dropdownRef}>
        <button
          className="text-xs bg-blue-700 text-white px-2 py-1 rounded font-bold border border-blue-500 hover:bg-blue-600"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          See More
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 mt-1 bg-gray-900 border border-blue-700 rounded shadow-lg z-10 min-w-[120px]">
            <button
              className="block w-full text-left px-4 py-2 text-blue-200 hover:bg-blue-800"
              onClick={() => { setSelectedStructure(structure); setActiveStructureTab('employees'); setDropdownOpen(false); }}
            >
              Employees
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-blue-200 hover:bg-blue-800"
              onClick={() => { setSelectedStructure(structure); setActiveStructureTab('travellogs'); setDropdownOpen(false); }}
            >
              Travel Logs
            </button>
          </div>
        )}
      </div>
      <div className="flex-1"></div>
      <button className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded font-bold border border-red-700 hover:bg-red-800 ml-auto" onClick={async () => await handleDeleteStructure(orgId, structure.id, setStructures, setSelectedStructure)}>Delete</button>
    </li>
  );
}
