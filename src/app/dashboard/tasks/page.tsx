"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskList } from "@/components/TaskList";
import { Loader2 } from "lucide-react";

export default function TasksPage() {
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

    if (!user || !userData) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const isManagerOrAdmin = userData.role === "admin" || userData.role === "manager";

    return (
        <div className="p-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Gestion des Tâches
                        </h1>
                        <p className="text-slate-500">
                            {isManagerOrAdmin ? "Créez et assignez des tâches à votre équipe." : "Gérez vos tâches assignées."}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <CreateTaskDialog users={users} onSuccess={() => console.log('Task created!')} />
                    </div>
                </header>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <TaskList />
                </div>
            </div>
        </div>
    );
}
