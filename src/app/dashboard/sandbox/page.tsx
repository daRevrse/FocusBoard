"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Swords, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function SandboxPage() {
    const { user, userData } = useAuth();
    const [quests, setQuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigningId, setAssigningId] = useState<string | null>(null);

    const fetchQuests = async () => {
        if (!userData?.company_id) return;
        setLoading(true);
        try {
            // Find all tasks that have NO assignee (empty string or not present)
            const q = query(
                collection(db, "tasks"),
                where("company_id", "==", userData.company_id),
                where("status", "==", "pending") // only pending tasks make sense
            );

            const snap = await getDocs(q);
            const orphanTasks = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((t: any) => !t.assignee_id || t.assignee_id === "");

            // Sort by priority or points (highest points first for game feel)
            orphanTasks.sort((a: any, b: any) => (Number(b.points) || 0) - (Number(a.points) || 0));
            setQuests(orphanTasks);
        } catch (error) {
            console.error("Error fetching quests:", error);
            toast.error("Erreur lors du chargement des quêtes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuests();
    }, [userData?.company_id]);

    const handleAssignQuest = async (quest: any) => {
        if (!user) return;
        setAssigningId(quest.id);

        try {
            // 1. Calculate bonus points (e.g. +50% rounded up)
            const basePoints = Number(quest.points) || 1;
            const bonusPoints = Math.ceil(basePoints * 1.5);

            // 2. Assign the task to the user, update points, and push status to 'in_focus' (optional, but good for starting immediately)
            await updateDoc(doc(db, "tasks", quest.id), {
                assignee_id: user.uid,
                status: "in_focus", // Auto-start the quest!
                points: bonusPoints,
                is_quest: true // Mark as a special quest
            });

            // 3. Log Activity
            await addDoc(collection(db, "activity_feed"), {
                company_id: userData?.company_id,
                user_id: user.uid,
                event_type: "quest_accepted",
                details: { taskId: quest.id, title: quest.title, basePoints, bonusPoints },
                created_at: serverTimestamp(),
            });

            toast.success(`Quête acceptée ! Vos points sont boostés à ${bonusPoints} pts.`);
            setQuests(quests.filter(q => q.id !== quest.id)); // Remove from list
        } catch (error) {
            console.error("Error assigning quest:", error);
            toast.error("Impossible d'accepter cette quête. Peut-être qu'elle a déjà été prise ?");
        } finally {
            setAssigningId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Recherche de quêtes en cours...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
            <header className="mb-8 bg-slate-950 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col items-center text-center shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-slate-900 to-amber-900 opacity-60"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/20">
                        <Swords className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4">
                        Le Bac à faire <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">(Quêtes Libres)</span>
                    </h1>
                    <p className="text-slate-300 max-w-2xl text-lg opacity-90 leading-relaxed">
                        Ces requêtes n'attendent qu'un héros. Assigne-toi une de ces tâches abandonnées et obtiens un <strong className="text-white">+50% de bonus de productivité</strong> sur tes points de Focus Journalier !
                    </p>
                </div>
            </header>

            {quests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-12">
                    <Sparkles className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Toutes les quêtes ont été accomplies</h3>
                    <p className="text-slate-500 max-w-md">
                        Le village est sauf... pour le moment. Revenez plus tard quand les Managers ajouteront de nouvelles tâches sans propriétaire.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quests.map((quest) => {
                        const basePts = Number(quest.points) || 1;
                        const boostedPts = Math.ceil(basePts * 1.5);

                        return (
                            <div key={quest.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all group overflow-hidden flex flex-col relative">
                                {/* Decorative badge */}
                                <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg items-center gap-1 flex">
                                    <Sparkles className="w-3 h-3" /> BONUS ACTIF
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex gap-2 mb-3">
                                        <Badge variant="outline" className="text-xs bg-slate-50">{quest.category}</Badge>
                                        {quest.priority === "critical" && <Badge variant="destructive" className="text-[10px]">CRITIQUE</Badge>}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-amber-600 transition-colors">{quest.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                                        {quest.description || "Aucune description fournie pour cette épreuve majeure."}
                                    </p>

                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 line-through decoration-red-400 font-medium">Base: {basePts} pts</span>
                                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-1">
                                                {boostedPts} pts
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => handleAssignQuest(quest)}
                                            disabled={assigningId === quest.id}
                                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0"
                                        >
                                            {assigningId === quest.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "J'y vais !"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
