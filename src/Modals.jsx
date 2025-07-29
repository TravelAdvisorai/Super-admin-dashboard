import React, { useState, useEffect } from "react";

/**
 * A reusable modal for editing the name of an item.
 */
export function EditModal({ isOpen, onClose, onSave, title, initialValue }) {
    const [value, setValue] = useState(initialValue);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(value);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md relative border-2 border-blue-900">
                <button className="absolute top-2 right-4 text-blue-400 hover:text-red-500 text-2xl" onClick={onClose}>&times;</button>
                <h3 className="text-lg font-bold mb-4 text-blue-300">{title}</h3>
                <input
                    className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
                <button
                    className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded w-full font-semibold transition border border-blue-700"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}

/**
 * Modal for creating a new structure.
 */
export function CreateStructureModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);
        await onCreate(name);
        setIsCreating(false);
        setName("");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md relative border-2 border-blue-900">
                <button className="absolute top-2 right-4 text-blue-400 hover:text-red-500 text-2xl" onClick={onClose}>&times;</button>
                <h3 className="text-lg font-bold mb-4 text-blue-300">Create New Structure</h3>
                <input
                    className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
                    placeholder="Structure Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isCreating}
                />
                <button
                    className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded w-full font-semibold transition border border-blue-700"
                    onClick={handleCreate}
                    disabled={isCreating || !name}
                >
                    {isCreating ? 'Creating...' : 'Create Structure'}
                </button>
            </div>
        </div>
    );
}

/**
 * Modal for creating a new organization.
 */
export function CreateOrgModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;
    
    const handleCreate = async () => {
        if (!id.trim() || !name.trim() || /\s/.test(id)) {
            alert("Both ID (no spaces) and Name are required.");
            return;
        }
        setIsCreating(true);
        try {
            await onCreate(name, id);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
            setName("");
            setId("");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md relative border-2 border-blue-900">
                <button className="absolute top-2 right-4 text-blue-400 hover:text-red-500 text-2xl" onClick={onClose}>&times;</button>
                <h3 className="text-lg font-bold mb-4 text-blue-300">Create New Organization</h3>
                <input
                    className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-2"
                    placeholder="Organization ID (unique, no spaces)"
                    value={id}
                    onChange={e => setId(e.target.value.replace(/\s/g, ''))}
                    disabled={isCreating}
                />
                <input
                    className="w-full border border-blue-700 bg-gray-950 text-blue-200 px-3 py-2 rounded mb-4"
                    placeholder="Organization Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isCreating}
                />
                <button
                    className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-4 py-2 rounded w-full font-semibold transition border border-blue-700"
                    onClick={handleCreate}
                    disabled={isCreating || !id || !name}
                >
                    {isCreating ? 'Creating...' : 'Create Organization'}
                </button>
            </div>
        </div>
    );
}