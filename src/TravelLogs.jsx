import React, { useEffect, useState, useMemo } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";

// Helper to format dates and timestamps
const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    if (dateInput.toDate) {
        return dateInput.toDate().toLocaleString();
    }
    const date = new Date(dateInput);
    if (isNaN(date)) return dateInput;
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Helper to apply colors based on status
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'booked':
            return 'bg-green-800 text-green-200';
        case 'approved':
            return 'bg-blue-800 text-blue-200';
        case 'pending':
            return 'bg-yellow-800 text-yellow-200';
        case 'denied':
            return 'bg-red-800 text-red-200';
        default:
            return 'bg-gray-700 text-gray-200';
    }
};

export default function TravelLogs({ organizationId, orgStructure, onBack }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for all filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');

    useEffect(() => {
        if (!organizationId || !orgStructure?.id) {
            setLogs([]);
            return;
        }
        setLoading(true);
        const logsQuery = query(
            collection(db, "travelRequests"),
            where("corporate.organizationId", "==", organizationId),
            where("corporate.orgStructureId", "==", orgStructure.id)
        );

        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLogs(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching travel logs:", error);
            toast.error("Failed to fetch travel logs.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [organizationId, orgStructure]);

    // Memoized filtering logic with Date Range
    const filteredLogs = useMemo(() => {
        const start = startDateFilter ? new Date(startDateFilter) : null;
        const end = endDateFilter ? new Date(endDateFilter) : null;
        
        // Adjust start to the beginning of the day and end to the end of the day
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        return logs.filter(log => {
            const statusMatch = statusFilter === 'all' || log.status?.toLowerCase() === statusFilter;

            const query = searchQuery.toLowerCase();
            const searchMatch = !query ||
                log.userName?.toLowerCase().includes(query) ||
                log.userEmail?.toLowerCase().includes(query) ||
                log.managerEmail?.toLowerCase().includes(query) ||
                log.destination?.toLowerCase().includes(query) ||
                log.departure?.toLowerCase().includes(query);
            
            const logDate = log.updatedAt?.toDate();
            if (!logDate && (start || end)) return false; // Don't show logs without a date if filtering by date
            const dateMatch = (!start || logDate >= start) && (!end || logDate <= end);
            
            return statusMatch && searchMatch && dateMatch;
        });
    }, [logs, statusFilter, searchQuery, startDateFilter, endDateFilter]);

    const clearFilters = () => {
        setStatusFilter('all');
        setSearchQuery('');
        setStartDateFilter('');
        setEndDateFilter('');
    };

    if (loading) {
        return <div className="text-center p-4 text-gray-400">Loading travel logs...</div>;
    }

    return (
        <div className="w-full bg-gray-950 p-4 sm:p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-300">
                    Travel Logs for: <span className="text-white">{orgStructure.name}</span>
                </h2>
                <button
                    className="bg-gray-800 text-gray-200 px-4 py-2 shadow hover:bg-gray-700 transition text-sm font-semibold"
                    onClick={onBack}
                >
                    &larr; Back to Dashboard
                </button>
            </div>

            {/* --- Enhanced Filter Controls --- */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div>
                        <label htmlFor="search-query" className="block text-sm font-medium text-blue-300 mb-1">Search</label>
                        <input id="search-query" type="text" placeholder="User, manager, location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 rounded-md" />
                    </div>
                    {/* Status Select */}
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-blue-300 mb-1">Status</label>
                        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-900 rounded-md" >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="booked">Booked</option>
                            <option value="denied">Denied</option>
                        </select>
                    </div>
                    {/* Date Range */}
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-blue-300 mb-1">Start Date</label>
                        <input id="start-date" type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-900 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-blue-300 mb-1">End Date</label>
                        <input id="end-date" type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="w-full border border-gray-700 px-3 py-2 text-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-900 rounded-md" />
                    </div>
                </div>
                <div className="mt-4">
                    <button onClick={clearFilters} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">Clear All Filters</button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredLogs.length > 0 ? filteredLogs.map(log => (
                    <div key={log.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg hover:border-blue-800 transition">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-bold text-base text-blue-300 border-b border-blue-900 pb-1">Trip Details</h4>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">Destination:</strong> {log.destination || 'N/A'}</p>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">Departure:</strong> {log.departure || 'N/A'}</p>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">Dates:</strong> {formatDate(log.startDate)} to {formatDate(log.endDate)}</p>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">Budget:</strong> {log.travelDetails?.budget ? `$${log.travelDetails.budget}` : 'Not Specified'}</p>
                                <p className="flex items-center text-gray-200"><strong className="text-gray-400 w-24 inline-block">Status:</strong> <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${getStatusColor(log.status)}`}>{log.status || 'N/A'}</span></p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-bold text-base text-blue-300 border-b border-blue-900 pb-1">People & Timestamps</h4>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">User:</strong> {log.userName || 'N/A'}</p>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">User Email:</strong> <span className="break-all">{log.userEmail}</span></p>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">Manager:</strong> <span className="break-all">{log.managerEmail || 'N/A'}</span></p>
                                <p className="text-gray-200"><strong className="text-gray-400 w-24 inline-block">Updated:</strong> {formatDate(log.updatedAt)}</p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-bold text-base text-blue-300 border-b border-blue-900 pb-1">Communication History</h4>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                    {log.history?.length > 0 ? log.history.map((msg, index) => (
                                        <div key={index} className={`p-2 rounded-md text-xs ${msg.isManagerApproval ? 'bg-blue-900/50 border-l-4 border-blue-600' : 'bg-gray-800/60 border-l-4 border-gray-600'}`}>
                                            <p className="font-semibold text-gray-300">{msg.sender === log.managerEmail ? 'Manager' : 'User'}:</p>
                                            <p className="text-gray-200">{msg.text}</p>
                                            {msg.approvalStatus && <p className="text-blue-300 font-bold capitalize pt-1">Status: {msg.approvalStatus}</p>}
                                        </div>
                                    )) : <p className="text-gray-500">No communications recorded.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-gray-400 py-10">
                        {searchQuery || statusFilter !== 'all' || startDateFilter || endDateFilter ? 'No travel logs match your filters.' : 'No travel logs found for this structure.'}
                    </div>
                )}
            </div>
        </div>
    );
}
