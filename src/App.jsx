import React, { useState } from "react";

import OrgList from "./OrgList";
import OrgDetails from "./OrgDetails";
import EmployeeForm from "./EmployeeForm";
import TravelLogs from "./TravelLogs";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function App() {
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, role, loading, login, logout, organizationId } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-2xl text-gray-400">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-100">
        <h1 className="text-3xl font-bold mb-6">TAAI Admin Portal</h1>
        <button
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded shadow text-lg font-semibold"
          onClick={login}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Render SuperAdminDashboard if role is 'superadmin'
  if (role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  // Otherwise, render the existing org admin/employee UI
  return (
    <>
      <div className="flex h-screen bg-gray-950 text-gray-100">
        {/* Sidebar */}
        <div className={`fixed h-full z-20 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'w-0' : 'w-80'}`} style={{ left: 0, top: 0, overflow: 'visible' }}>
          {!sidebarCollapsed && (
            <aside className="h-full bg-gray-900 border-r border-gray-800 w-80 overflow-hidden relative transition-all duration-500 ease-in-out">
              <button
                className="absolute top-1/2 right-2 transform -translate-y-1/2 translate-x-1/2 bg-white border-2 border-blue-700 text-blue-700 rounded-full shadow-lg p-2 flex items-center justify-center z-30 hover:bg-blue-100 focus:outline-none transition-all duration-300"
                style={{ width: '40px', height: '40px' }}
                onClick={() => setSidebarCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                {/* Left arrow SVG */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16L8 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <OrgList
                selectedOrgId={selectedStructure?.id}
                onSelectOrg={setSelectedStructure}
                collapsed={false}
                user={user}
                role={role}
              />
            </aside>
          )}
        </div>
        {/* Sidebar open button */}
        {sidebarCollapsed && (
          <button
            className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-white border-2 border-blue-700 text-blue-700 rounded-r-full shadow-lg p-2 flex items-center justify-center z-30 hover:bg-blue-100 focus:outline-none transition-all duration-300"
            style={{ width: '40px', height: '64px' }}
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
          >
            {/* Right arrow SVG */}
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 4L12 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {/* Main content */}
        <main className={`flex-1 flex flex-col overflow-auto bg-gray-950 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'ml-0' : 'ml-80'}`}>
          {/* User info and logout */}
          <div className="flex items-center justify-end gap-4 p-4 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-blue-700" />
              <span className="font-semibold text-blue-300">{user.displayName}</span>
              <span className="text-xs text-gray-400">({role})</span>
            </div>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1 rounded text-sm ml-2"
              onClick={logout}
            >
              Logout
            </button>
          </div>
          {selectedStructure ? (
            <>
              <OrgDetails organizationId={organizationId} orgStructure={selectedStructure} role={role} />
              <EmployeeForm organizationId={organizationId} orgStructure={selectedStructure} role={role} />
              <TravelLogs organizationId={organizationId} orgStructure={selectedStructure} role={role} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-2xl text-gray-400">
              Select an org structure to view details
            </div>
          )}
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}