"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { filterLatestRecurringTasks } from "@/lib/task-utils";

interface Task {
    id: string;
    title: string;
    status: string;
    points: number;
    requires_deliverable?: boolean;
}

export function WidgetTaskList() {
    const { user, userData } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!user || !userData?.company_id) return;

        // Fetch Tasks currently active or pending for this user
        const q = query(
            collection(db, "tasks"),
            where("assignee_id", "==", user.uid),
            where("status", "in", ["pending", "in_focus"])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
            // Exact status filter (to match TaskList precision)
            const exactStatusList = list.filter(t => t.status === "pending" || t.status === "in_focus");
            setTasks(filterLatestRecurringTasks(exactStatusList));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData]);

    const completeTask = async (task: Task) => {
        if (task.requires_deliverable) {
            toast.error("Format Livrable requis. Veuillez valider depuis la fenêtre principale.", {
                duration: 4000,
            });
            return;
        }

        try {
            await updateDoc(doc(db, "tasks", task.id), {
                status: "completed",
                completed_at: serverTimestamp()
            });

            // Update user Pi Score
            const focusDocs = await getDocs(query(collection(db, "daily_focus"), where("user_id", "==", user!.uid), where("status", "==", "active")));
            if (!focusDocs.empty) {
                const focusDoc = focusDocs.docs[0];
                const newCompleted = (focusDoc.data().total_points_completed || 0) + (task.points || 1);
                await updateDoc(doc(db, "daily_focus", focusDoc.id), { total_points_completed: newCompleted });
                const currentCommitted = focusDoc.data().total_points_committed || 1;
                const newScore = Math.min(100, Math.round((newCompleted / currentCommitted) * 100));
                await updateDoc(doc(db, "users", user!.uid), { pi_score: newScore });
            }

            // Log activity
            await addDoc(collection(db, "activity_feed"), {
                company_id: userData!.company_id,
                user_id: user!.uid,
                event_type: "task_completed",
                details: { taskId: task.id, title: task.title, points: task.points },
                created_at: serverTimestamp()
            });

            toast.success("Tâche terminée ! 🎉");
        } catch (e) {
            console.error("Error completing task:", e);
        }
    };

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user || !userData) return;
        setAdding(true);
        try {
            await addDoc(collection(db, "tasks"), {
                title: newTaskTitle.trim(),
                status: "pending",
                priority: "medium", // Default fallback
                points: 1, // Default fallback
                category: "Autre",
                assignee_id: user.uid,
                creator_id: user.uid,
                company_id: userData.company_id,
                created_at: serverTimestamp(),
                requires_deliverable: false
            });
            setNewTaskTitle("");
        } catch (e) {
            console.error("Error quickly adding task:", e);
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#FDFBF7]">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FDFBF7] text-slate-900 overflow-hidden font-sans">
            <div className="p-3 border-b bg-white border-slate-200 shrink-0 shadow-sm z-10">
                <h3 className="font-semibold text-sm mb-2 flex items-center justify-between">
                    <span>Mes Tâches</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-medium">
                        {tasks.length} {tasks.length > 1 ? "actives" : "active"}
                    </span>
                </h3>
                <form onSubmit={handleQuickAdd} className="flex flex-col gap-2 relative">
                    <input
                        type="text"
                        placeholder="Créer une tâche rapidement..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full text-sm px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-primary shadow-inner"
                        disabled={adding}
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1 p-1 bg-slate-100 hover:bg-slate-200 focus:bg-slate-200 rounded text-slate-600 active:scale-95 transition-all"
                        disabled={!newTaskTitle.trim() || adding}
                    >
                        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {tasks.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 mt-8 flex flex-col items-center">
                        <Check className="w-8 h-8 text-emerald-300 mb-2 opacity-50" />
                        <p>Aucune tâche en attente !</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="group flex items-center gap-3 p-2.5 bg-transparent hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <button
                                onClick={() => completeTask(task)}
                                className="w-[18px] h-[18px] shrink-0 rounded-full border-[1.5px] border-slate-400 focus:outline-none flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-500 hover:shadow-inner transition-all group-hover:bg-white"
                                title="Marquer comme terminée"
                            >
                                <Check className="w-3 h-3 stroke-[3px]" />
                            </button>
                            <span className="text-sm font-medium text-slate-700 cursor-default line-clamp-2 leading-tight">
                                {task.title}
                            </span>
                            {task.requires_deliverable && (
                                <span className="ml-auto text-[9px] font-bold tracking-wider uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm shrink-0">Livrable</span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
