"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    userData: any | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    logout: async () => { },
    refreshUserData: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeData: () => void;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Listen to real-time updates for user data (XP, PI, Profile)
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            setUserData(docSnap.data());
                        }
                    });
                } catch (error) {
                    console.error("Error setting up user data listener:", error);
                }
            } else {
                setUserData(null);
                if (unsubscribeData) unsubscribeData();
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
        };
    }, []);

    const refreshUserData = async () => {
        if (!user) return;
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        } catch (error) {
            console.error("Error refreshing user data:", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
