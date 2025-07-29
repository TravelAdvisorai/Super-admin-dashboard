import React, { useState } from "react";
import OrgList from "./OrgList";
import OrgDetails from "./OrgDetails";
import EmployeeForm from "./EmployeeForm";
import TravelLogs from "./TravelLogs";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';

// Reusable Tailwind classes for the sidebar toggle buttons
const sidebarButtonBaseClasses = "fixed top-1/2 transform -translate-y-1/2 bg-white border-2 border-blue-700 text-blue-700 shadow-lg p-2 flex items-center justify-center z-30 hover:bg-blue-100 focus:outline-none transition-all duration-300";

// --- Main App Component ---
export default function App() {
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 570);
  const [isViewingLogs, setIsViewingLogs] = useState(false); // State to control logs view
  const { user, role, loading, login, logout, organizationId } = useAuth();

  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 570) {
        setSidebarCollapsed(true);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectStructure = (structure) => {
    setSelectedStructure(structure);
    setIsViewingLogs(false); // Reset to main view when a new structure is selected
    if (window.innerWidth < 570) {
      setSidebarCollapsed(true);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-2xl text-gray-400">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-100 p-4 text-center">
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

  // Render the Super Admin Dashboard for the 'superadmin' role
  if (role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  // Render the standard dashboard for 'admin' or 'employee' roles
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex h-screen bg-gray-950 text-gray-100">

        {/* --- Sidebar --- */}
        {!isViewingLogs && (
          <aside className={`fixed h-full z-20 transition-all duration-300 ease-in-out ${sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'} w-80`}>
            <div className="h-full bg-gray-900 border-r border-gray-800 w-80 overflow-y-auto relative">
              <button
                className={`${sidebarButtonBaseClasses} right-0 translate-x-1/2 rounded-full`}
                style={{ width: '40px', height: '40px' }}
                onClick={() => setSidebarCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16L8 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <OrgList
                selectedOrgId={selectedStructure?.id}
                onSelectOrg={handleSelectStructure}
                user={user}
                role={role}
              />
            </div>
          </aside>
        )}

        {/* --- Sidebar expand button --- */}
        {sidebarCollapsed && !isViewingLogs && (
          <button
            className={`${sidebarButtonBaseClasses} left-0 rounded-r-full`}
            style={{ width: '40px', height: '64px' }}
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4L12 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        {/* --- Main Content --- */}
        <main className={`flex-1 flex flex-col overflow-auto bg-gray-950 transition-all duration-300 ease-in-out ${sidebarCollapsed || isViewingLogs ? 'ml-0' : 'ml-80'}`}>
          <header className="flex items-center justify-end gap-2 sm:gap-4 p-4 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-blue-700" />
              <div className="hidden sm:flex flex-col items-start">
                  <span className="font-semibold text-blue-300 text-sm">{user.displayName}</span>
                  <span className="text-xs text-gray-400">({role})</span>
              </div>
            </div>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1 rounded text-sm ml-2"
              onClick={logout}
            >
              Logout
            </button>
          </header>

          <div className="p-4 md:p-6 lg:p-8">
            {selectedStructure ? (
              isViewingLogs ? (
                <TravelLogs
                  organizationId={organizationId}
                  orgStructure={selectedStructure}
                  onBack={() => setIsViewingLogs(false)}
                />
              ) : (
                <div className="space-y-8">
                  <OrgDetails organizationId={organizationId} orgStructure={selectedStructure} role={role} />
                  <div className="flex justify-end">
                    <button 
                      className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded shadow text-base font-semibold"
                      onClick={() => setIsViewingLogs(true)}
                    >
                      View Travel Logs &rarr;
                    </button>
                  </div>
                  <EmployeeForm organizationId={organizationId} orgStructure={selectedStructure} role={role} />
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center text-xl sm:text-2xl text-gray-400 h-full text-center">
                Select an org structure to view details
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
