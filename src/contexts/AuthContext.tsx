"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    userData: any | null;
    companyData: any | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    companyData: null,
    loading: true,
    logout: async () => { },
    refreshUserData: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [companyData, setCompanyData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    // Effect for the global theme
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.body.classList.remove("theme-default", "theme-blue", "theme-amber", "theme-rose");
            if (companyData?.platform_theme) {
                document.body.classList.add(`theme-${companyData.platform_theme}`);
            } else {
                document.body.classList.add("theme-default");
            }
        }
    }, [companyData?.platform_theme]);

    useEffect(() => {
        let unsubscribeData: () => void;
        let unsubscribeCompany: () => void;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Listen to real-time updates for user data (XP, PI, Profile)
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setUserData(data);

                            // Also listen for company updates based on this user's company_id
                            if (data.company_id) {
                                if (unsubscribeCompany) unsubscribeCompany();
                                unsubscribeCompany = onSnapshot(doc(db, "companies", data.company_id), (compSnap) => {
                                    if (compSnap.exists()) {
                                        setCompanyData(compSnap.data());
                                    }
                                });
                            }
                        }
                    });
                } catch (error) {
                    console.error("Error setting up user data listener:", error);
                }
            } else {
                setUserData(null);
                setCompanyData(null);
                if (unsubscribeData) unsubscribeData();
                if (unsubscribeCompany) unsubscribeCompany();
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
            if (unsubscribeCompany) unsubscribeCompany();
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
        <AuthContext.Provider value={{ user, userData, companyData, loading, logout, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
