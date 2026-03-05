"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

import { Loader2, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskList } from "@/components/TaskList";
import { MorningCheckIn } from "@/components/MorningCheckIn";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PerformanceChart } from "@/components/PerformanceChart";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
    const { user, userData } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
    const [selectedUserIdForStats, setSelectedUserIdForStats] = useState<string>("");
    const [isSocialFeedOpen, setIsSocialFeedOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (userData?.company_id) {
                try {
                    // Fetch Users
                    const qUsers = query(
                        collection(db, "users"),
                        where("company_id", "==", userData.company_id)
                    );
                    const usersSnap = await getDocs(qUsers);
                    setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

                    // Fetch Teams
                    const qTeams = query(
                        collection(db, "teams"),
                        where("company_id", "==", userData.company_id)
                    );
                    const teamsSnap = await getDocs(qTeams);
                    setTeams(teamsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

                    const qTasks = query(
                        collection(db, "tasks"),
                        where("company_id", "==", userData.company_id)
                    );
                    const tasksSnap = await getDocs(qTasks);
                    setTasks(tasksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

                    // Fetch Projects
                    const qProjects = query(
                        collection(db, "projects"),
                        where("company_id", "==", userData.company_id),
                        where("status", "in", ["planning", "active"])
                    );
                    const projectsSnap = await getDocs(qProjects);
                    setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                } finally {
                    setLoadingUsers(false);
                }
            }
        };

        fetchDashboardData();
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
                        <p className="text-slate-500">Bienvenue sur votre espace de travail Faucus.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="bg-white"
                            onClick={() => setIsSocialFeedOpen(true)}
                        >
                            <Bell className="mr-2 h-4 w-4" />
                            Flux Social
                        </Button>
                        <CreateTaskDialog users={users} projects={projects} onSuccess={() => console.log('Task created!')} />
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <div className="col-span-1 space-y-6">
                        <MorningCheckIn />

                        {isManagerOrAdmin && (
                            <div className="rounded-xl border bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-3 mb-4">
                                    <h2 className="text-lg font-semibold">Mon Équipe</h2>
                                    {teams.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant={selectedTeamId === "all" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedTeamId("all")}
                                                className="h-7 text-xs rounded-full px-3 py-0"
                                            >
                                                Tous
                                            </Button>
                                            {teams.map(t => (
                                                <Button
                                                    key={t.id}
                                                    variant={selectedTeamId === t.id ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setSelectedTeamId(t.id)}
                                                    className="h-7 text-xs rounded-full px-3 py-0"
                                                >
                                                    {t.name}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {loadingUsers ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                    <ul className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                        {(selectedTeamId === "all" ? users : users.filter(u => teams.find(t => t.id === selectedTeamId)?.members?.includes(u.id))).map((u) => {
                                            const userTasks = tasks.filter(t => t.assignee_id === u.id);
                                            const completed = userTasks.filter(t => t.status === "completed").length;
                                            const pending = userTasks.filter(t => t.status === "pending" || t.status === "in_focus").length;

                                            return (
                                                <li key={u.id} className="flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50 gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                                                            alt={u.full_name}
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="text-sm font-medium truncate">{u.full_name}</div>
                                                            <div className="text-xs text-slate-500 capitalize">{u.role}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                            {completed} terminées
                                                        </span>
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                            {pending} en cours
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                        {(selectedTeamId === "all" ? users : users.filter(u => teams.find(t => t.id === selectedTeamId)?.members?.includes(u.id))).length === 0 && (
                                            <div className="text-sm text-slate-500 text-center py-4">Aucun membre dans cette équipe.</div>
                                        )}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="col-span-2 space-y-6">
                        {isManagerOrAdmin ? (
                            <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col min-h-[350px]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <h2 className="text-lg font-semibold">Performances</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant={selectedUserIdForStats === "all" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedUserIdForStats("all")}
                                            className="h-8 text-xs rounded-full"
                                        >
                                            Équipe (Moi)
                                        </Button>
                                        {users.slice(0, 3).map(u => (
                                            <Button
                                                key={u.id}
                                                variant={selectedUserIdForStats === u.id ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedUserIdForStats(u.id)}
                                                className="h-8 text-xs rounded-full"
                                            >
                                                {u.full_name?.split(' ')[0] || "User"}
                                            </Button>
                                        ))}
                                        {users.length > 3 && (
                                            <Select value={selectedUserIdForStats} onValueChange={setSelectedUserIdForStats}>
                                                <SelectTrigger className="w-[100px] h-8 text-xs rounded-full">
                                                    <SelectValue placeholder="Autres..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.slice(3).map(u => (
                                                        <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-h-[300px] w-full mt-4">
                                    <PerformanceChart targetUserId={selectedUserIdForStats === "all" ? user?.uid : (selectedUserIdForStats || user?.uid)} />
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col min-h-[350px]">
                                <h2 className="text-lg font-semibold mb-4">Mes Performances</h2>
                                <div className="flex-1 min-h-[300px] w-full mt-4">
                                    <PerformanceChart />
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">Tâches en Cours</h2>
                            <TaskList projects={projects} />
                        </div>
                    </div>
                </div>

                {/* Right Panel for Social Feed */}
                <div
                    className={cn(
                        "fixed inset-y-0 right-0 z-50 w-full max-w-sm transform bg-white shadow-2xl transition-transform duration-300 ease-in-out border-l",
                        isSocialFeedOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-lg font-semibold">Social Feed</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsSocialFeedOpen(false)}>
                                <X className="h-5 w-5 text-slate-500" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                            <ActivityFeed />
                        </div>
                    </div>
                </div>

                {/* Overlay backdrop */}
                {isSocialFeedOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSocialFeedOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
