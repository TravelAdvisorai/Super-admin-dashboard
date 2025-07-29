import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [organizationId, setOrganizationId] = useState(null);
    const [loading, setLoading] = useState(true); // Start in a loading state
    const [error, setError] = useState(null);

    useEffect(() => {
        // onAuthStateChanged listens for login/logout events and runs on initial load
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    // Fetch custom user data (like role) from Firestore
                    const userDocRef = doc(db, 'user_directory', firebaseUser.email);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        // Determine role based on flags in the user document
                        const userRole = userData.superadmin ? 'superadmin' : (userData.admin ? 'admin' : 'employee');
                        setRole(userRole);
                        setOrganizationId(userData.organizationId || null);
                    } else {
                        // Handle case where user is authenticated but not in our database
                        setRole('employee'); // Default to the lowest privilege
                        setOrganizationId(null);
                    }
                } catch (e) {
                    console.error("Failed to fetch user data:", e);
                    // Default to lowest privilege on error
                    setRole('employee');
                    setOrganizationId(null);
                    setError("Could not verify user role.");
                }
            } else {
                // User is logged out, clear all session data
                setUser(null);
                setRole(null);
                setOrganizationId(null);
            }
            // Finished initial auth check, set loading to false
            setLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, []); // Empty array ensures this effect runs only once on mount

    const login = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, provider);
        } catch (e) {
            console.error("Login failed:", e);
            setError('Login failed. Please try again.');
        }
    };

    const logout = async () => {
        setError(null);
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Logout failed:", e);
            setError('Logout failed. Please try again.');
        }
    };

    const value = { user, role, organizationId, loading, login, logout, error };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
