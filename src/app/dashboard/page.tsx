"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskList } from "@/components/TaskList";
import { MorningCheckIn } from "@/components/MorningCheckIn";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PerformanceChart } from "@/components/PerformanceChart";

export default function DashboardPage() {
    const { user, userData } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            if (userData?.company_id) {
                try {
                    const q = query(
                        collection(db, "users"),
                        where("company_id", "==", userData.company_id)
                    );
                    const querySnapshot = await getDocs(q);
                    const usersList = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setUsers(usersList);
                } catch (error) {
                    console.error("Error fetching users:", error);
                } finally {
                    setLoadingUsers(false);
                }
            }
        };

        fetchUsers();
    }, [userData]);

    if (!user || !userData) return null; // Handled by layout

    const isManagerOrAdmin = userData.role === "admin" || userData.role === "manager";

    return (
        <div className="p-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Bonjour, {userData.full_name || user.email}
                        </h1>
                        <p className="text-slate-500">Bienvenue sur votre FocusBoard.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <CreateTaskDialog users={users} onSuccess={() => console.log('Task created!')} />
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="col-span-1 space-y-6">
                        <MorningCheckIn />

                        {isManagerOrAdmin && (
                            <div className="rounded-xl border bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold">Mon Équipe</h2>
                                {loadingUsers ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <ul className="space-y-3">
                                        {users.map((u) => (
                                            <li key={u.id} className="flex items-center gap-3">
                                                <img
                                                    src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                                                    alt={u.full_name}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                                <div className="text-sm font-medium">{u.full_name}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {!isManagerOrAdmin && (
                            <PerformanceChart />
                        )}
                    </div>

                    <div className="col-span-2 space-y-6">
                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">Tâches en Cours</h2>
                            <TaskList />
                        </div>

                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">Social Feed</h2>
                            <ActivityFeed />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
