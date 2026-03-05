"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle2, Circle, Clock, Target, AlertCircle, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

export default function SupervisionPage() {
    const { user, userData } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.company_id || !isManagerOrAdmin) {
                setLoading(false);
                return;
            }

            try {
                // Fetch all users
                const qUsers = query(collection(db, "users"), where("company_id", "==", userData.company_id));
                const usersSnap = await getDocs(qUsers);
                const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Filter out non-active users and pending invites
                const activeUsersList = usersList.filter((u: any) => u.status !== 'inactive' && u.status !== 'pending_invite');

                setUsers(activeUsersList);

                // Fetch all recent tasks for company
                // For a true dashboard, we might want only tasks from the last X days, but let's fetch pending and recently completed
                const qTasks = query(collection(db, "tasks"), where("company_id", "==", userData.company_id));
                const tasksSnap = await getDocs(qTasks);
                const tasksList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Keep only tasks from today or unfinished
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const relevantTasks = tasksList.filter((t: any) => {
                    if (t.status !== 'done') return true;
                    if (t.completed_at) {
                        const compDate = new Date(t.completed_at.toDate());
                        return compDate >= today;
                    }
                    return false;
                });

                setTasks(relevantTasks);
            } catch (error) {
                console.error("Error fetching supervision data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData, isManagerOrAdmin]);

    if (!isManagerOrAdmin) {
        return <div className="p-8">Accès refusé.</div>;
    }

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "done": return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
            case "in_progress": return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
            case "blocked": return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
            default: return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
        }
    };

    return (
        <div className="p-8 min-h-screen bg-[#FDFBF7]">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <Target className="text-primary w-8 h-8" />
                        Suivi d'exécution
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Vue globale sur l'avancement de votre équipe en temps réel.
                    </p>
                </header>

                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                    {users.map((u) => {
                        const userTasks = tasks.filter(t => t.assigned_to === u.id);
                        const doneCount = userTasks.filter(t => t.status === "done").length;
                        const piScore = u.pi_score !== undefined ? Math.round(u.pi_score) : null;

                        return (
                            <div
                                key={u.id}
                                className="break-inside-avoid bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                                onClick={() => setSelectedUser({ ...u, tasks: userTasks })}
                            >
                                <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 group-hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                                            alt={u.full_name}
                                            className="w-10 h-10 rounded-full border shadow-sm shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-slate-900 truncate">{u.full_name}</h3>
                                            <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                                        </div>
                                    </div>
                                    {piScore !== null && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">PI</span>
                                            <span className={cn("font-black", piScore >= 80 ? 'text-emerald-600' : piScore >= 50 ? 'text-amber-500' : 'text-rose-500')}>
                                                {piScore}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                        <span>Focus en cours ({userTasks.length})</span>
                                        <span className="text-primary">{doneCount}/{userTasks.length}</span>
                                    </div>
                                    {userTasks.length > 0 ? (
                                        <ul className="space-y-2.5">
                                            {userTasks.map(t => (
                                                <li key={t.id} className="flex gap-2.5 items-start text-sm">
                                                    {getStatusIcon(t.status)}
                                                    <span className={cn("leading-snug line-clamp-2", t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 font-medium')}>
                                                        {t.title}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Aucun focus pour le moment.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* User Detail Dialog */}
                <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogContent className="sm:max-w-2xl">
                        {selectedUser && (
                            <>
                                <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
                                    <img
                                        src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.full_name}`}
                                        alt={selectedUser.full_name}
                                        className="w-16 h-16 rounded-full border shadow-sm"
                                    />
                                    <div>
                                        <DialogTitle className="text-2xl">{selectedUser.full_name}</DialogTitle>
                                        <p className="text-slate-500 capitalize">{selectedUser.role} • {selectedUser.email}</p>
                                    </div>
                                    <div className="ml-auto text-center mr-4 flex items-center gap-6">
                                        <div>
                                            <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Performance Index</div>
                                            <div className="text-4xl font-black text-slate-900">{selectedUser.pi_score !== undefined ? Math.round(selectedUser.pi_score) : 0}%</div>
                                        </div>
                                        <Link href={`/dashboard/team/${selectedUser.id}`} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0" title="Zoom sur l'utilisateur">
                                            <Maximize2 className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </DialogHeader>
                                <div className="mt-6">
                                    <h4 className="font-semibold text-slate-900 mb-4 border-b pb-2">Liste des tâches ({selectedUser.tasks?.length})</h4>
                                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                        {selectedUser.tasks?.length > 0 ? selectedUser.tasks.map((t: any) => (
                                            <div key={t.id} className="p-4 rounded-xl border bg-slate-50 flex items-start gap-3">
                                                {getStatusIcon(t.status)}
                                                <div>
                                                    <h5 className={cn("font-medium", t.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-900')}>{t.title}</h5>
                                                    {t.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{t.description}</p>}
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-slate-500 text-center py-8">Aucune tâche assignée.</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
