import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [organizationId, setOrganizationId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            setUser(firebaseUser);
            if (firebaseUser) {
                // Fetch admin boolean and organizationId from user_directory
                try {
                    const userRef = doc(db, 'user_directory', firebaseUser.email);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.superadmin === true) {
                            setRole('superadmin');
                        } else if (data.admin === true) {
                            setRole('admin');
                        } else {
                            setRole('employee');
                        }
                        setOrganizationId(data.organizationId || null);
                    } else {
                        setRole('employee');
                        setOrganizationId(null);
                    }
                } catch (e) {
                    console.log(e);
                    setRole('employee');
                    setOrganizationId(null);
                }
            } else {
                setRole(null);
                setOrganizationId(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, provider);
        } catch (e) {
            console.log(e);
            setError('Login failed');
        }
    };

    const logout = async () => {
        setError(null);
        try {
            await signOut(auth);
        } catch (e) {
            console.log(e);
            setError('Logout failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, organizationId, loading, login, logout, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
} 