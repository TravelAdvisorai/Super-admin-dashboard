import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";


export default function TravelLogs({ organizationId, orgStructure, onBack }) {
    // All hooks at the top, always in the same order
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [filters, setFilters] = useState({ userEmail: "", managerEmail: "", destination: "", departure: "" });
    const [sortOrder, setSortOrder] = useState("latest");
    const [page, setPage] = useState(1);
    const [editLog, setEditLog] = useState(null);
    const [editData, setEditData] = useState({ subject: "", status: "", userEmail: "" });
    const [saving, setSaving] = useState(false);
    const PAGE_SIZE = 10;

    // Ref for refresh
    async function fetchLogs() {
        if (!organizationId || !orgStructure || !orgStructure.id) return;
        setLoading(true);
        setLogs([]);
        try {
            const ref = collection(db, "organizations", organizationId, "orgStructures", orgStructure.id, "travelRequests");
            const snap = await getDocs(ref);
            setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
        setPage(1);
    }, [organizationId, orgStructure]);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [filters.userEmail, filters.managerEmail, filters.destination, filters.departure, sortOrder]);

    if (!organizationId || !orgStructure || !orgStructure.id) return null;
    if (loading) return <div className="p-8 text-gray-400">Loading travel logs...</div>;

    // Filtering
    const filteredLogs = logs.filter(log =>
        (!filters.userEmail || (log.userEmail || "").toLowerCase().includes(filters.userEmail.toLowerCase())) &&
        (!filters.managerEmail || (log.managerEmail || "").toLowerCase().includes(filters.managerEmail.toLowerCase())) &&
        (!filters.destination || (log.destination || "").toLowerCase().includes(filters.destination.toLowerCase())) &&
        (!filters.departure || (log.departure || "").toLowerCase().includes(filters.departure.toLowerCase()))
    );

    // Sorting
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        const aTime = a.updatedAt && a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : (a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0);
        const bTime = b.updatedAt && b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : (b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0);
        if (sortOrder === "latest") {
            return bTime - aTime;
        } else {
            return aTime - bTime;
        }
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
    const paginatedLogs = sortedLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Save edit
    async function handleEditSave() {
        setSaving(true);
        const { updateDoc, doc } = await import("firebase/firestore");
        await updateDoc(doc(db, "organizations", organizationId, "orgStructures", orgStructure.id, "travelRequests", editLog.id), editData);
        setLogs(logs => logs.map(l => l.id === editLog.id ? { ...l, ...editData } : l));
        setEditLog(null);
        setSaving(false);
    }

    return (
        <div className="fixed inset-0 bg-gray-950 flex flex-col items-stretch justify-start z-10 border-4 border-blue-900">
            <div className="flex items-center mt-6 mb-2 px-8">
                <button
                    className="bg-gray-900 border border-blue-800 text-blue-200 px-4 py-2 rounded hover:bg-blue-900 hover:text-white font-semibold transition mr-4"
                    onClick={() => onBack ? onBack() : window.history.back()}
                >
                    &larr; Back
                </button>
                <h2 className="text-3xl font-extrabold text-blue-200 tracking-wide text-center flex-1">Travel Logs</h2>
            </div>
            {/* Filters and Refresh */}
            <div className="flex flex-wrap gap-4 mb-6 items-center justify-between px-8">
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <input
                        className="bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder-gray-400 w-48"
                        placeholder="Filter by user email"
                        value={filters.userEmail}
                        onChange={e => setFilters(f => ({ ...f, userEmail: e.target.value }))}
                    />
                    <input
                        className="bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder-gray-400 w-48"
                        placeholder="Filter by manager email"
                        value={filters.managerEmail}
                        onChange={e => setFilters(f => ({ ...f, managerEmail: e.target.value }))}
                    />
                    <input
                        className="bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder-gray-400 w-48"
                        placeholder="Filter by destination"
                        value={filters.destination}
                        onChange={e => setFilters(f => ({ ...f, destination: e.target.value }))}
                    />
                    <input
                        className="bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder-gray-400 w-48"
                        placeholder="Filter by departure"
                        value={filters.departure}
                        onChange={e => setFilters(f => ({ ...f, departure: e.target.value }))}
                    />
                    <select
                        className="bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-700 w-48"
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                    >
                        <option value="latest">Sort by Activity: Latest</option>
                        <option value="oldest">Sort by Activity: Oldest</option>
                    </select>
                </div>
                <button
                    className="bg-blue-900 border border-blue-700 text-blue-100 rounded-full p-2 shadow hover:bg-blue-700 hover:text-white focus:outline-none transition-all duration-200 ml-2"
                    style={{ zIndex: 10 }}
                    onClick={fetchLogs}
                    disabled={loading}
                    aria-label="Refresh travel logs"
                >
                    {/* Modern refresh icon (circular arrow) */}
                    <svg
                        className={loading ? "animate-spin" : ""}
                        xmlns="http://www.w3.org/2000/svg"
                        width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-7.36L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 7.36L3 16" />
                    </svg>
                </button>
            </div>
            {sortedLogs.length === 0 ? (
                <div className="text-blue-200 text-center mt-12">No travel requests found.</div>
            ) : (
                <div className="overflow-x-auto border-2 border-blue-900 bg-gray-950 shadow-xl rounded-xl mx-8">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-900 border-b-2 border-blue-900">
                            <tr>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Subject</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">User</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Email</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Manager</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Departure</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Destination</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Dates</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-left font-bold text-blue-200 uppercase tracking-wider">Updated</th>
                                <th className="py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.map(log => (
                                <React.Fragment key={log.id}>
                                    <tr className="hover:bg-gray-900 transition">
                                        <td className="py-2 px-4 text-blue-100">{log.subject || "(No Subject)"}</td>
                                        <td className="py-2 px-4 text-blue-100">{log.userName}</td>
                                        <td className="py-2 px-4 text-blue-100">{log.userEmail}</td>
                                        <td className="py-2 px-4 text-blue-100">{log.managerEmail || "-"}</td>
                                        <td className="py-2 px-4 text-blue-100">{log.departure}</td>
                                        <td className="py-2 px-4 text-blue-100">{log.destination}</td>
                                        <td className="py-2 px-4 text-blue-100">{log.startDate} - {log.endDate}</td>
                                        <td className="py-2 px-4">
                                            <span className={`text-xs px-2 py-1 font-bold uppercase rounded ${log.status === "approved" ? "bg-blue-800 text-blue-200" : log.status === "pending" ? "bg-blue-700 text-blue-100" : "bg-black text-blue-400 border border-blue-700"}`}>{log.status}</span>
                                        </td>
                                        <td className="py-2 px-4 text-blue-400">{log.updatedAt && log.updatedAt.toDate ? log.updatedAt.toDate().toLocaleString() : "-"}</td>
                                        <td className="py-2 px-4 flex gap-2 items-center">
                                            <button
                                                className="text-xs text-blue-400 hover:underline mr-2"
                                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                            >
                                                {expandedId === log.id ? "Hide" : "Show"} History
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedId === log.id && log.history && Array.isArray(log.history) && (
                                        <tr>
                                            <td colSpan={10} className="bg-gray-900 border-t border-blue-900 text-blue-200 p-3 whitespace-pre-wrap rounded-b-xl">
                                                {log.history.map((h, i) => (
                                                    typeof h === 'object' && h !== null && h.sender && h.text ? (
                                                        <div key={i} className="mb-3">
                                                            <div className="font-bold text-blue-300">{h.sender}</div>
                                                            <div className="ml-2">{h.text}</div>
                                                        </div>
                                                    ) : (
                                                        <div key={i} className="mb-1">{h}</div>
                                                    )
                                                ))}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {/* Pagination controls */}
                    <div className="flex items-center justify-between p-4 bg-gray-950 border-t border-blue-900 rounded-b-xl">
                        <button
                            className="px-3 py-1 bg-gray-900 text-blue-200 border border-blue-700 rounded disabled:opacity-50 hover:bg-blue-800"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span className="text-blue-300 text-sm">Page {page} of {totalPages}</span>
                        <button
                            className="px-3 py-1 bg-gray-900 text-blue-200 border border-blue-700 rounded disabled:opacity-50 hover:bg-blue-800"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}