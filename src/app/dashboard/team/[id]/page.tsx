"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft, Trophy, CheckCircle2, Clock, CalendarDays, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { PerformanceChart } from "@/components/PerformanceChart";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const userId = resolvedParams.id;

    const { user, userData } = useAuth();
    const router = useRouter();

    const [targetUser, setTargetUser] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";

    useEffect(() => {
        if (!userData || !isManagerOrAdmin) {
            if (userData && !isManagerOrAdmin) router.push("/dashboard");
            return;
        }

        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                // Fetch User Details
                const userDoc = await getDoc(doc(db, "users", userId));
                if (!userDoc.exists() || userDoc.data().company_id !== userData.company_id) {
                    router.push("/dashboard/team");
                    return;
                }
                setTargetUser({ id: userDoc.id, ...userDoc.data() });

                // Fetch User Tasks
                const tasksQuery = query(
                    collection(db, "tasks"),
                    where("assignee_id", "==", userId),
                    where("company_id", "==", userData.company_id)
                );
                const taskDocs = await getDocs(tasksQuery);
                const tasksList = taskDocs.docs.map(t => ({ id: t.id, ...t.data() }));

                // Sort tasks manually since we can't always guarantee index on created_at with multiple wheres yet
                tasksList.sort((a: any, b: any) => {
                    const timeA = a.created_at?.toMillis?.() || 0;
                    const timeB = b.created_at?.toMillis?.() || 0;
                    return timeB - timeA; // Descending
                });

                setTasks(tasksList);

            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId, userData, isManagerOrAdmin, router]);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!targetUser) return null;

    const completedTasks = tasks.filter(t => t.status === "completed");
    const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "in_focus");

    // Quick calc total points completed
    const totalPointsCompleted = completedTasks.reduce((acc, curr) => acc + (curr.points || 0), 0);

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button
                        variant="ghost"
                        className="mb-2 -ml-2 text-slate-500 hover:text-slate-900"
                        onClick={() => router.push("/dashboard/team")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'équipe
                    </Button>
                    <div className="flex items-center gap-4">
                        <img
                            src={targetUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${targetUser.full_name}`}
                            alt={targetUser.full_name}
                            className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
                        />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                {targetUser.full_name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs uppercase">
                                    {targetUser.role}
                                </Badge>
                                <span className="text-sm text-slate-500">{targetUser.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Points Gérés</div>
                        <div className="text-3xl font-bold text-indigo-600 flex items-center justify-end gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            {totalPointsCompleted}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Stats Cards */}
                <div className="col-span-1 space-y-6">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Aperçu de l'Activité
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="font-medium">Tâches Complétées</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{completedTasks.length}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium">Tâches en Cours</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{activeTasks.length}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CalendarDays className="w-5 h-5 text-indigo-500" />
                                    <span className="font-medium">Inscrit(e) depuis</span>
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                    {targetUser.created_at ? format(targetUser.created_at.toDate(), "MMM yyyy", { locale: fr }) : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Privilèges</h2>
                        {targetUser.flags && targetUser.flags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {targetUser.flags.map((flag: string) => (
                                    <Badge key={flag} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                        {flag}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Aucun privilège spécial assigné.</p>
                        )}
                    </div>
                </div>

                {/* Main Content: Performance & Recent Tasks */}
                <div className="col-span-2 space-y-6">
                    <PerformanceChart targetUserId={userId} />

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900">Tâches Récentes</h2>
                        {tasks.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                Aucune tâche trouvée pour ce collaborateur.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tasks.slice(0, 10).map((task) => (
                                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors gap-4">
                                        <div>
                                            <h3 className="font-medium text-slate-900 line-clamp-1">{task.title}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span>{task.category}</span>
                                                <span>•</span>
                                                <span>{task.points} pts</span>
                                                {task.created_at && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Créée {formatDistanceToNow(task.created_at.toDate(), { addSuffix: true, locale: fr })}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={task.status === "completed" ? "default" : task.status === "in_focus" ? "secondary" : "outline"}
                                            className={
                                                task.status === "completed" ? "bg-emerald-500 hover:bg-emerald-600 w-fit" :
                                                    task.status === "in_focus" ? "bg-amber-100 text-amber-800 w-fit" : "w-fit"
                                            }
                                        >
                                            {task.status === "completed" ? "Terminée" : task.status === "in_focus" ? "En Focus" : "En cours"}
                                        </Badge>
                                    </div>
                                ))}
                                {tasks.length > 10 && (
                                    <div className="text-center pt-2">
                                        <span className="text-sm text-slate-500">Et {tasks.length - 10} autres tâches non affichées.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
