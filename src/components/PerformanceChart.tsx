"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { Loader2 } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function PerformanceChart() {
    const { user, userData } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !userData?.company_id) return;

        const fetchPerformanceData = async () => {
            try {
                // Fetch the last 7 days of daily_focus for the current user
                const q = query(
                    collection(db, "daily_focus"),
                    where("user_id", "==", user.uid),
                    where("status", "==", "completed"),
                    orderBy("date", "desc"),
                    limit(7)
                );

                const snapshot = await getDocs(q);
                const focusData = snapshot.docs.map(doc => doc.data());

                // Create an array for the last 7 days, filling in gaps with 0 PI
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const dateObj = subDays(new Date(), i);
                    const dateStr = dateObj.toISOString().split('T')[0];

                    const focusRecord = focusData.find(d => d.date === dateStr);

                    chartData.push({
                        name: format(dateObj, "EEE", { locale: fr }), // e.g., "lun", "mar"
                        fullDate: format(dateObj, "d MMM", { locale: fr }), // e.g. "12 oct"
                        pi: focusRecord ? focusRecord.performance_index || 0 : 0
                    });
                }

                setData(chartData);
            } catch (error) {
                console.error("Error fetching performance data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformanceData();
    }, [user, userData]);

    if (loading) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center rounded-xl border bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Calculate average PI
    const nonZeroDays = data.filter(d => d.pi > 0);
    const avgPi = nonZeroDays.length > 0
        ? Math.round(nonZeroDays.reduce((acc, curr) => acc + curr.pi, 0) / nonZeroDays.length)
        : 0;

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Performance Index</h2>
                    <p className="text-sm text-slate-500">Vos 7 derniers jours d'activité</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{avgPi}%</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">Moyenne</div>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-white p-3 shadow-md">
                                            <p className="font-medium text-slate-900 mb-1">{payload[0].payload.fullDate}</p>
                                            <p className="text-sm text-primary font-bold">PI: {payload[0].value}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                        <Bar
                            dataKey="pi"
                            fill="#0f172a"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
                <div className="h-0.5 w-4 bg-green-500 opacity-50 border border-green-500 border-dashed border-b-0 border-x-0"></div>
                Objectif: 80% (Hyper-focus)
            </div>
        </div>
    );
}
