"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    LayoutDashboard,
    CheckSquare,
    Users,
    Settings,
    LogOut,
    Target,
    MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();
    const { user, userData, logout } = useAuth();
    const [unreadChat, setUnreadChat] = useState(false);

    useEffect(() => {
        if (!userData?.company_id || !user?.uid) return;

        const qChannels = query(collection(db, "channels"), where("company_id", "==", userData.company_id));
        const qReads = query(collection(db, "channel_reads"), where("user_id", "==", user.uid));

        let channelsData: any[] = [];
        let readsData: Record<string, any> = {};

        const checkUnreads = () => {
            for (const c of channelsData) {
                if (c.type !== 'general' && !c.members?.includes(user.uid)) continue;
                if (!c.updated_at) continue;

                const lastRead = readsData[c.id];
                if (!lastRead || c.updated_at.toMillis() > lastRead.toMillis()) {
                    setUnreadChat(true);
                    return;
                }
            }
            setUnreadChat(false);
        };

        const unsubChannels = onSnapshot(qChannels, (snap) => {
            channelsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            checkUnreads();
        });

        const unsubReads = onSnapshot(qReads, (snap) => {
            readsData = {};
            snap.docs.forEach(doc => { readsData[doc.data().channel_id] = doc.data().last_read_at; });
            checkUnreads();
        });

        return () => {
            unsubChannels();
            unsubReads();
        };
    }, [userData?.company_id, user?.uid]);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";

    const navItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            visible: true,
        },
        {
            title: "Tâches",
            href: "/dashboard/tasks",
            icon: CheckSquare,
            visible: true,
        },
        {
            title: "Messagerie",
            href: "/dashboard/chat",
            icon: MessageCircle,
            visible: true,
        },
        {
            title: "Équipe",
            href: "/dashboard/team",
            icon: Users,
            visible: isManagerOrAdmin,
        },
        {
            title: "Paramètres",
            href: "/dashboard/settings",
            icon: Settings,
            visible: isManagerOrAdmin,
        },
    ];

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white">
            {/* App Logo/Header */}
            <div className="flex h-16 items-center px-6 border-b">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <Target className="h-6 w-6 text-primary" />
                    <span>FocusBoard</span>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {navItems.map((item) => {
                    if (!item.visible) return null;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-100 text-slate-900"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                                {item.title === "Messagerie" && unreadChat && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </div>
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout footer */}
            <div className="border-t p-4">
                <Link href="/dashboard/profile" className="flex items-center gap-3 mb-4 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50 cursor-pointer">
                    <img
                        src={userData?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.full_name || 'U'}`}
                        alt={userData?.full_name || "Utilisateur"}
                        className="h-10 w-10 rounded-full bg-slate-100 object-cover"
                    />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {userData?.full_name || "Chargement..."}
                        </p>
                        <p className="text-xs text-slate-500 capitalize truncate">
                            {userData?.role || ""}
                        </p>
                    </div>
                </Link>
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="h-5 w-5" />
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}
