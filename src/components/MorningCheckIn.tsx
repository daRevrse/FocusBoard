"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, getDoc, increment, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AstralClock } from "@/components/ui/AstralClock";
import { filterLatestRecurringTasks } from "@/lib/task-utils";
import confetti from "canvas-confetti";

interface Task {
    id: string;
    title: string;
    status: string;
    parent_task_id?: string | null;
    [key: string]: any;
}

export function MorningCheckIn() {
    const { user, userData } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [availableTasks, setAvailableTasks] = useState<any[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [dailyFocusId, setDailyFocusId] = useState<string | null>(null);
    const [focusData, setFocusData] = useState<any>(null);
    const [isEditingFocus, setIsEditingFocus] = useState(false);

    // End of Day logic
    const [endOfDayOpen, setEndOfDayOpen] = useState(false);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        if (!user || !userData?.company_id) return;

        let isFetchingTasks = false;
        setLoading(true);

        const today = new Date().toISOString().split('T')[0];
        const focusQuery = query(
            collection(db, "daily_focus"),
            where("user_id", "==", user.uid),
            where("date", "==", today)
        );

        const unsubscribe = onSnapshot(focusQuery, async (snapshot) => {
            if (!snapshot.empty) {
                const fData = snapshot.docs[0].data();
                setFocusData(fData);
                if (fData.status === "active") {
                    setDailyFocusId(snapshot.docs[0].id);
                    setSelectedTaskIds(fData.task_ids || []);
                } else if (fData.status === "completed") {
                    setDailyFocusId(snapshot.docs[0].id);
                }
                setLoading(false);
            } else {
                setFocusData(null);
                setDailyFocusId(null);

                if (isFetchingTasks) return;
                isFetchingTasks = true;

                try {
                    const tasksQuery = query(
                        collection(db, "tasks"),
                        where("assignee_id", "==", user.uid),
                        where("status", "in", ["pending"])
                    );
                    const taskDocs = await getDocs(tasksQuery);
                    const tasksList = taskDocs.docs.map(t => ({ id: t.id, ...t.data() } as Task));

                    const parentIds = new Set(tasksList.map(t => t.parent_task_id).filter(Boolean));
                    const selectableTasks = tasksList.filter(t => !parentIds.has(t.id));

                    const filteredSelectableTasks = filterLatestRecurringTasks(selectableTasks);

                    setAvailableTasks(filteredSelectableTasks);

                    if (selectableTasks.length > 0) {
                        setOpen(true);
                    }
                } catch (error) {
                    console.error("Error fetching dependencies for Morning Check-in:", error);
                } finally {
                    isFetchingTasks = false;
                    setLoading(false);
                }
            }
        }, (error) => {
            console.error("Error listening to daily focus:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData]);

    const toggleTask = (taskId: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSubmit = async () => {
        if (!user || !userData?.company_id || selectedTaskIds.length === 0) return;

        setSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const selectedFullTasks = availableTasks.filter(t => selectedTaskIds.includes(t.id));

            if (isEditingFocus && dailyFocusId && focusData) {
                // Determine added vs removed tasks
                const previousTaskIds = focusData.task_ids || [];
                const tasksToAdd = selectedTaskIds.filter(id => !previousTaskIds.includes(id));
                const tasksToRemove = previousTaskIds.filter((id: string) => !selectedTaskIds.includes(id));

                // Calculate new totals. Penalty: Editing adds +1 to committed points arbitrarily if changed
                const netPointsChange = selectedFullTasks.reduce((acc, curr) => acc + Number(curr.points), 0) - focusData.total_points_committed;
                // Add 1 penalty point if they are dropping tasks or changing them mid-day (unless they are perfectly same which shouldn't happen)
                const isChanging = tasksToAdd.length > 0 || tasksToRemove.length > 0;
                const penalty = isChanging ? 1 : 0;

                const newCommittedPoints = focusData.total_points_committed + netPointsChange + penalty;

                // Update focus record
                await updateDoc(doc(db, "daily_focus", dailyFocusId), {
                    total_points_committed: newCommittedPoints,
                    task_ids: selectedTaskIds,
                });

                // Recalculate and update user PI score
                const newPiScore = newCommittedPoints > 0
                    ? Math.min(100, Math.round((focusData.total_points_completed / newCommittedPoints) * 100))
                    : 0;
                await updateDoc(doc(db, "users", user.uid), {
                    pi_score: newPiScore
                });

                // Update removed tasks back to pending
                const removePromises = tasksToRemove.map((taskId: string) =>
                    updateDoc(doc(db, "tasks", taskId), { status: "pending" })
                );
                await Promise.all(removePromises);

                // Update added tasks to in_focus
                const addPromises = tasksToAdd.map((taskId: string) =>
                    updateDoc(doc(db, "tasks", taskId), { status: "in_focus" })
                );
                await Promise.all(addPromises);

                // Log activity
                await addDoc(collection(db, "activity_feed"), {
                    company_id: userData.company_id,
                    user_id: user.uid,
                    event_type: "focus_edited",
                    details: {
                        penaltyApplied: penalty,
                        tasksAdded: tasksToAdd.length,
                        tasksRemoved: tasksToRemove.length
                    },
                    created_at: serverTimestamp(),
                });

                toast.success(isChanging ? `Focus mis à jour (-${penalty} pt de pénalité).` : "Aucun changement détecté.");
                setFocusData({ ...focusData, total_points_committed: newCommittedPoints, task_ids: selectedTaskIds });
            } else {
                // Initial Check-in
                const totalPoints = selectedFullTasks.reduce((acc, curr) => acc + Number(curr.points), 0);

                // Create Daily Focus record
                const focusRef = await addDoc(collection(db, "daily_focus"), {
                    user_id: user.uid,
                    company_id: userData.company_id,
                    date: today,
                    status: "active",
                    total_points_committed: totalPoints,
                    total_points_completed: 0,
                    task_ids: selectedTaskIds,
                });

                // Reset PI Score for the new day
                await updateDoc(doc(db, "users", user.uid), {
                    pi_score: 0
                });

                // Update tasks status to "in_focus"
                const updatePromises = selectedTaskIds.map(taskId =>
                    updateDoc(doc(db, "tasks", taskId), { status: "in_focus" })
                );
                await Promise.all(updatePromises);

                // Log activity
                await addDoc(collection(db, "activity_feed"), {
                    company_id: userData.company_id,
                    user_id: user.uid,
                    event_type: "morning_focus_set",
                    details: { points: totalPoints, taskCount: selectedTaskIds.length },
                    created_at: serverTimestamp(),
                });

                setDailyFocusId(focusRef.id);
                setFocusData({
                    user_id: user.uid,
                    status: "active",
                    total_points_committed: totalPoints,
                    total_points_completed: 0,
                    task_ids: selectedTaskIds,
                });
                toast.success("Focus du jour validé !");
            }

            setOpen(false);
            setIsEditingFocus(false);
        } catch (error) {
            console.error("Error setting morning focus:", error);
            toast.error("Erreur lors de l'enregistrement du focus.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEndOfDay = async () => {
        if (!dailyFocusId || !user || !userData?.company_id || !focusData) return;

        setCompleting(true);
        try {
            const pi = focusData.total_points_committed > 0
                ? Math.round((focusData.total_points_completed / focusData.total_points_committed) * 100)
                : 0;

            await updateDoc(doc(db, "daily_focus", dailyFocusId), {
                status: "completed",
                performance_index: pi,
                completed_at: serverTimestamp()
            });

            // Sync PI Score to user profile
            await updateDoc(doc(db, "users", user.uid), {
                pi_score: pi,
                xp: increment(pi) // Bonus XP equivalent to PI score
            });

            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                audio.volume = 0.5;
                audio.play();
            } catch (err) { }

            if (pi >= 80) {
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) { return clearInterval(interval); }
                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
                }, 250);
            } else {
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
            }

            await addDoc(collection(db, "activity_feed"), {
                company_id: userData.company_id,
                user_id: user.uid,
                event_type: "day_completed",
                details: { pi, pointsCompleted: focusData.total_points_completed },
                created_at: serverTimestamp(),
            });

            // Update local state to reflect completion
            setFocusData({ ...focusData, status: "completed", performance_index: pi });
            setEndOfDayOpen(false);

        } catch (error) {
            console.error("Error completing day:", error);
        } finally {
            setCompleting(false);
        }
    };

    const handleReopenDay = async () => {
        if (!dailyFocusId || !user || !userData?.company_id || !focusData) return;

        setSubmitting(true);
        try {
            const newCommittedPoints = focusData.total_points_committed + 1; // 1 point penalty

            await updateDoc(doc(db, "daily_focus", dailyFocusId), {
                status: "active",
                total_points_committed: newCommittedPoints,
            });

            await addDoc(collection(db, "activity_feed"), {
                company_id: userData.company_id,
                user_id: user.uid,
                event_type: "day_reopened",
                details: { penalty: 1 },
                created_at: serverTimestamp(),
            });

            setFocusData({ ...focusData, status: "active", total_points_committed: newCommittedPoints });
            toast.success("Journée réouverte ! (+1 pt de pénalité engagé)");
        } catch (error) {
            console.error("Error reopening day:", error);
            toast.error("Erreur lors de la réouverture.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !focusData) return null;

    const handleOpenEdit = async () => {
        // Fetch current in_focus tasks plus pending ones to allow swapping
        setLoading(true);
        try {
            const tasksQuery = query(
                collection(db, "tasks"),
                where("assignee_id", "==", user?.uid),
                where("status", "in", ["pending", "in_focus"]) // Allow previously in_focus tasks to be deselected too
            );
            const taskDocs = await getDocs(tasksQuery);
            const tasksList = taskDocs.docs.map(t => ({ id: t.id, ...t.data() } as Task));

            const parentIds = new Set(tasksList.map(t => t.parent_task_id).filter(Boolean));
            const selectableTasks = tasksList.filter(t => !parentIds.has(t.id));
            const filteredSelectableTasks = filterLatestRecurringTasks(selectableTasks);

            setAvailableTasks(filteredSelectableTasks);
            setSelectedTaskIds(focusData?.task_ids || []);
            setIsEditingFocus(true);
            setOpen(true);
        } catch (error) {
            console.error("Error fetching tasks for edit:", error);
            toast.error("Erreur de chargement des tâches.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="rounded-xl border bg-white p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold relative z-10">Morning Check-in</h2>
                    <div className="flex items-center gap-3">
                        {focusData?.status === "active" && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="px-3 md:px-4 text-xs md:text-sm text-slate-500 hover:text-slate-900 bg-white"
                                onClick={handleOpenEdit}
                                title="Modifier mon focus (Pénalité de 1 pt)"
                                disabled={submitting}
                            >
                                <Pencil className="h-3.5 w-3.5 md:mr-2" />
                                <span className="hidden md:inline">Modifier</span>
                            </Button>
                        )}
                        {/* Astral Clock slightly faded in the background or right corner */}
                        <div className="w-32 h-16 opacity-80 pointer-events-none -mt-4 -mr-4 hidden md:block">
                            <AstralClock />
                        </div>
                    </div>
                </div>

                {dailyFocusId ? (
                    <div className="space-y-4">
                        <div className="rounded-md bg-green-50 p-4 border border-green-100">
                            <p className="text-sm font-medium text-green-800">
                                Focus du jour {focusData?.status === "completed" ? "terminé" : "validé"} ! 🎯
                            </p>
                            <p className="text-xs text-green-600 mt-1 mb-3">
                                {focusData?.status === "completed"
                                    ? `Total: ${focusData?.total_points_completed}/${focusData?.total_points_committed} pts (PI: ${focusData?.performance_index}%)`
                                    : `Total: ${focusData?.total_points_completed || 0}/${focusData?.total_points_committed} pts. Restez concentré(e) !`
                                }
                            </p>
                            {focusData?.status === "active" && (
                                <div className="flex mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-white text-green-700 hover:bg-green-50 hover:text-green-800 border-green-200 font-medium py-4 shadow-sm active:scale-[0.98] transition-all"
                                        onClick={() => setEndOfDayOpen(true)}
                                    >
                                        <Trophy className="w-4 h-4 mr-2" /> Clôturer ma journée
                                    </Button>
                                </div>
                            )}
                            {focusData?.status === "completed" && (
                                <div className="flex mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-white text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-200"
                                        onClick={handleReopenDay}
                                        disabled={submitting}
                                    >
                                        Ré-ouvrir ma journée (Pénalité de 1 pt)
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="mb-4 text-sm text-slate-500">
                            Définissez votre focus du jour pour commencer.
                        </p>
                        <Button className="w-full" onClick={() => setOpen(true)}>
                            Démarrer ma journée
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={(val) => {
                if (!val) setIsEditingFocus(false);
                setOpen(val);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>🎯 {isEditingFocus ? "Modifier le Focus" : "Morning Focus"}</DialogTitle>
                        <DialogDescription>
                            {isEditingFocus
                                ? "Modifiez les tâches de votre focus. Attention : une pénalité de 1 point est appliquée en cas de changement en cours de journée."
                                : "Sélectionnez les tâches sur lesquelles vous vous engagez aujourd'hui. Soyez réaliste pour garantir un Performance Index optimal !"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {availableTasks.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">
                                Vous n'avez aucune tâche assignée en attente.
                            </p>
                        ) : (
                            availableTasks.map((task) => (
                                <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                                    <Checkbox
                                        id={`task-${task.id}`}
                                        checked={selectedTaskIds.includes(task.id)}
                                        onCheckedChange={() => toggleTask(task.id)}
                                        className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none w-full">
                                        <label
                                            htmlFor={`task-${task.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex justify-between"
                                        >
                                            <span className="truncate pr-2">{task.title}</span>
                                            <Badge variant="secondary" className="shrink-0">{task.points} pts</Badge>
                                        </label>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {task.category} • {task.priority.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Plus tard</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || selectedTaskIds.length === 0}
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Valider mon Focus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={endOfDayOpen} onOpenChange={setEndOfDayOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Fin de journée
                        </DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr(e) de vouloir clôturer votre journée ?
                            Les tâches non terminées seront reportées.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 flex flex-col items-center justify-center">
                        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                <path
                                    className="text-slate-100"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                {(() => {
                                    const perc = focusData?.total_points_committed > 0
                                        ? Math.round(((focusData?.total_points_completed || 0) / focusData?.total_points_committed) * 100)
                                        : 0;
                                    const color = perc >= 80 ? 'text-emerald-500' : perc >= 50 ? 'text-amber-500' : 'text-rose-500';
                                    return (
                                        <path
                                            className={`${color} transition-all duration-1000 ease-out`}
                                            strokeDasharray={`${Math.max(1, perc)}, 100`}
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    );
                                })()}
                            </svg>
                            <div className="text-3xl font-black text-slate-800 tracking-tight z-10 flex items-baseline">
                                {focusData?.total_points_committed > 0
                                    ? Math.round(((focusData?.total_points_completed || 0) / focusData?.total_points_committed) * 100)
                                    : 0}<span className="text-xl text-slate-400 font-bold ml-0.5">%</span>
                            </div>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 text-center mb-2">
                            {(() => {
                                const perc = focusData?.total_points_committed > 0 ? Math.round(((focusData?.total_points_completed || 0) / focusData?.total_points_committed) * 100) : 0;
                                if (perc === 100) return "Journée Héroïque ! 🏆";
                                if (perc >= 80) return "Excellent travail ! 🌟";
                                if (perc >= 50) return "Bonne session globale 👍";
                                return "Demain sera meilleur ! 💪";
                            })()}
                        </h3>
                        <div className="text-xs font-medium bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 border border-slate-200 shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {focusData?.total_points_completed || 0} / {focusData?.total_points_committed} Points Validés
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEndOfDayOpen(false)}>Continuer à travailler</Button>
                        <Button
                            onClick={handleEndOfDay}
                            disabled={completing}
                        >
                            {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Clôturer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
