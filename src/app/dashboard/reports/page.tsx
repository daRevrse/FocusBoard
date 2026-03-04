"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Download, Target, PlayCircle, CheckCircle2 } from "lucide-react";
import { format, subDays, startOfMonth, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface FocusRecord {
    id: string;
    date: string;
    performance_index: number;
    completion_rate: number;
    status: string;
}

interface TaskRecord {
    id: string;
    title: string;
    status: string;
    priority: string;
    completed_at?: Timestamp | null;
}

export default function ReportsPage() {
    const { user, userData } = useAuth();
    const [period, setPeriod] = useState<string>("today"); // today, month, custom
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");

    const [focusLogs, setFocusLogs] = useState<FocusRecord[]>([]);
    const [completedTasks, setCompletedTasks] = useState<TaskRecord[]>([]);

    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        if (!user || !userData) return;
        setLoading(true);

        try {
            let startDate: Date;
            let endDate: Date = new Date();

            if (period === "today") {
                startDate = startOfDay(new Date());
            } else if (period === "month") {
                startDate = startOfMonth(new Date());
            } else if (period === "custom") {
                if (!customStart || !customEnd) {
                    setLoading(false);
                    return;
                }
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                endDate = endOfDay(endDate);
            } else {
                startDate = startOfDay(new Date());
            }

            // Fetch Focus records
            const dateStrStart = startDate.toISOString().split('T')[0];
            const dateStrEnd = endDate.toISOString().split('T')[0];

            // Note: In an ideal world we use a real Firestore range query here.
            // Since we're keeping it simple and our data size is small per user, 
            // we'll fetch everything for the user and filter in memory if needed,
            // or use specific bounds. Here we just fetch their recent logs to avoid missing indices.

            const qFocus = query(
                collection(db, "daily_focus"),
                where("user_id", "==", user.uid),
                where("status", "==", "completed")
            );
            const focusSnap = await getDocs(qFocus);
            // Filter in memory for simplicity with strings
            const filteredFocus = focusSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as FocusRecord))
                .filter(d => d.date >= dateStrStart && d.date <= dateStrEnd)
                .sort((a, b) => b.date.localeCompare(a.date));

            setFocusLogs(filteredFocus);

            // Fetch Tasks
            const qTasks = query(
                collection(db, "tasks"),
                where("assignee_id", "==", user.uid),
                where("status", "==", "completed")
            );
            const taskSnap = await getDocs(qTasks);

            const filteredTasks = taskSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as TaskRecord))
                .filter(t => {
                    if (!t.completed_at) return false;
                    const cDate = t.completed_at.toDate();
                    return cDate >= startDate && cDate <= endDate;
                })
                .sort((a, b) => b.completed_at!.toMillis() - a.completed_at!.toMillis());

            setCompletedTasks(filteredTasks);

        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (period !== "custom") {
            fetchReport();
        }
    }, [period, user, userData]);

    const handleGenerateCustom = () => {
        fetchReport();
    };

    const handlePrint = () => {
        window.print();
    };

    // Aggregates
    const avgPi = focusLogs.length > 0
        ? Math.round(focusLogs.reduce((acc, curr) => acc + curr.performance_index, 0) / focusLogs.length)
        : 0;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8 flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rapports & Synthèses</h1>
                    <p className="text-slate-500">Générez vos reportings de performances.</p>
                </div>
                <Button onClick={handlePrint} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exporter (PDF)
                </Button>
            </header>

            <div className="bg-white p-6 rounded-xl border mb-8 flex items-center gap-4 print:hidden">
                <div className="w-[200px]">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger>
                            <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Aujourd'hui</SelectItem>
                            <SelectItem value="month">Ce Mois-ci</SelectItem>
                            <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {period === "custom" && (
                    <div className="flex items-center gap-4">
                        <Input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className="w-[160px]"
                        />
                        <span className="text-slate-400">à</span>
                        <Input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="w-[160px]"
                        />
                        <Button onClick={handleGenerateCustom}>Générer</Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="space-y-8 bg-white p-10 rounded-xl border print:border-none print:p-0">
                    <div className="text-center pb-8 border-b">
                        <h2 className="text-2xl font-bold text-slate-800">Rapport d'Activité FocusBoard</h2>
                        <p className="text-slate-500 mt-2">
                            {userData?.full_name} • Période : {
                                period === "today" ? format(new Date(), "d MMMM yyyy", { locale: fr })
                                    : period === "month" ? "Ce Mois-ci"
                                        : `${customStart} au ${customEnd}`
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full">
                                <Target className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-900">{avgPi}%</div>
                                <div className="text-sm text-slate-500 font-medium">Index de Performance Moyen</div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-900">{completedTasks.length}</div>
                                <div className="text-sm text-slate-500 font-medium">Tâches Complétées</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Détail des Sessions Focus
                        </h3>
                        {focusLogs.length === 0 ? (
                            <p className="text-slate-500 italic text-sm">Aucune session Focus terminée sur cette période.</p>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Index de Performance</th>
                                            <th className="px-4 py-3">Taux de Complétion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {focusLogs.map(log => (
                                            <tr key={log.id} className="bg-white">
                                                <td className="px-4 py-3 font-medium">{format(new Date(log.date), "dd MMM yyyy", { locale: fr })}</td>
                                                <td className="px-4 py-3 text-indigo-600 font-bold">{log.performance_index}%</td>
                                                <td className="px-4 py-3 text-emerald-600">{log.completion_rate}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Tâches Accomplies
                        </h3>
                        {completedTasks.length === 0 ? (
                            <p className="text-slate-500 italic text-sm">Aucune tâche accomplie sur cette période.</p>
                        ) : (
                            <ul className="space-y-3">
                                {completedTasks.map(task => (
                                    <li key={task.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                        <div>
                                            <p className="font-medium text-slate-800">{task.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Terminée le {task.completed_at ? format(task.completed_at.toDate(), "dd MMM à HH:mm") : "N/A"}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            Priorité {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
