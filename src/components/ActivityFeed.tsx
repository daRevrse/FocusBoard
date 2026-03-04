"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, Target, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityEvent {
    id: string;
    user_id: string;
    event_type: "task_completed" | "morning_focus_set" | "day_completed";
    details: any;
    created_at: any;
}

export function ActivityFeed() {
    const { user, userData } = useAuth();
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersCache, setUsersCache] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!userData?.company_id) return;

        // Fetch team members for names/avatars cache
        // In a real app we might want a more robust user caching strategy
        const fetchTeam = async () => {
            // Simplified for MVP, we might miss new users added during session
            // Real-time listener on users would be better but heavier.
            // We rely on the dashboard already fetching users in a real prod scenario.
            const teamQuery = query(collection(db, "users"), where("company_id", "==", userData.company_id));
            const unsubTeam = onSnapshot(teamQuery, (snap) => {
                const cache: Record<string, any> = {};
                snap.docs.forEach(d => { cache[d.id] = d.data(); });
                setUsersCache(cache);
            });
            return unsubTeam;
        };

        let unsubTeam: any;
        fetchTeam().then(unsub => unsubTeam = unsub);

        const q = query(
            collection(db, "activity_feed"),
            where("company_id", "==", userData.company_id),
            orderBy("created_at", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feed = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ActivityEvent[];
            setEvents(feed);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (unsubTeam) unsubTeam();
        };
    }, [userData]);

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-slate-500">
                Aucune activité pour le moment. Soyez le premier à valider une tâche !
            </div>
        );
    }

    const renderEventMessage = (event: ActivityEvent) => {
        const actor = usersCache[event.user_id]?.full_name || "Un membre";

        switch (event.event_type) {
            case "task_completed":
                return (
                    <>
                        <span className="font-semibold text-slate-900">{actor}</span> a terminé une tâche de{" "}
                        <span className="font-medium text-primary">{event.details?.points} pts</span>.
                    </>
                );
            case "morning_focus_set":
                return (
                    <>
                        <span className="font-semibold text-slate-900">{actor}</span> s'est engagé(e) sur un focus de{" "}
                        <span className="font-medium text-primary">{event.details?.points} pts</span>
                        {" "} ({event.details?.taskCount} tâches).
                    </>
                );
            case "day_completed":
                return (
                    <>
                        <span className="font-semibold text-slate-900">{actor}</span> a clôturé sa journée avec un Performance Index de{" "}
                        <span className="font-bold text-green-600">{event.details?.pi}%</span> !
                    </>
                );
            default:
                return "Nouvelle activité.";
        }
    };

    const renderEventIcon = (type: string) => {
        switch (type) {
            case "task_completed":
                return <div className="p-2 bg-green-50 text-green-600 rounded-full"><CheckCircle2 className="h-4 w-4" /></div>;
            case "morning_focus_set":
                return <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Target className="h-4 w-4" /></div>;
            case "day_completed":
                return <div className="p-2 bg-yellow-50 text-yellow-600 rounded-full"><Trophy className="h-4 w-4" /></div>;
            default:
                return <div className="p-2 bg-slate-50 text-slate-600 rounded-full"><CheckCircle2 className="h-4 w-4" /></div>;
        }
    };

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <div key={event.id} className="flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2">
                    {renderEventIcon(event.event_type)}
                    <div className="flex-1 space-y-1">
                        <p className="text-slate-600">
                            {renderEventMessage(event)}
                        </p>
                        {event.created_at && (
                            <p className="text-xs text-slate-400">
                                Il y a {formatDistanceToNow(event.created_at.toDate(), { locale: fr })}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
