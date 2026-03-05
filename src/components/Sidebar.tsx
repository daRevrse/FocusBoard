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
    MessageCircle,
    FileText,
    FolderKanban,
    HardDrive,
    LifeBuoy,
    Swords,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();
    const { user, userData, logout } = useAuth();
    const [unreadChat, setUnreadChat] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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

    // Fermeture auto sur mobile lors de la nav
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";

    const menuGroups = [
        {
            label: "Mon Espace",
            items: [
                { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visible: true },
                { title: "Tâches", href: "/dashboard/tasks", icon: CheckSquare, visible: true },
                { title: "Messagerie", href: "/dashboard/chat", icon: MessageCircle, visible: true },
                { title: "Le bac à faire", href: "/dashboard/sandbox", icon: Swords, visible: true },
            ]
        },
        {
            label: "Entreprise",
            items: [
                { title: "Projets", href: "/dashboard/projects", icon: FolderKanban, visible: true },
                { title: "Documents", href: "/dashboard/documents", icon: HardDrive, visible: true },
                { title: "Data Center", href: "/dashboard/datacenter", icon: Target, visible: true },
                { title: "Rapports", href: "/dashboard/reports", icon: FileText, visible: true },
                { title: "Support", href: "/dashboard/support", icon: LifeBuoy, visible: true },
                { title: "Équipe", href: "/dashboard/team", icon: Users, visible: isManagerOrAdmin },
                { title: "Paramètres", href: "/dashboard/settings", icon: Settings, visible: isManagerOrAdmin },
            ]
        }
    ];

    const renderLink = (item: any) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center" : "gap-3",
                    isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
                title={isCollapsed ? item.title : undefined}
            >
                <div className="relative flex-shrink-0">
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                    {item.title === "Messagerie" && unreadChat && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </div>
                {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 shadow-sm rounded-md"
                onClick={() => setIsMobileOpen(true)}
            >
                <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Component */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r bg-white transition-all duration-300 md:relative",
                isCollapsed ? "w-20" : "w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Mobile Close Button */}
                <button
                    className="md:hidden absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                    onClick={() => setIsMobileOpen(false)}
                >
                    <X className="h-5 w-5" />
                </button>

                {/* App Logo/Header */}
                <div className="flex h-16 items-center px-4 md:px-6 border-b shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                        <Target className="h-6 w-6 text-primary shrink-0" />
                        {!isCollapsed && <span className="truncate mt-0.5">FocusBoard</span>}
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="px-3 pt-6">
                            {!isCollapsed && (
                                <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    {group.label}
                                </h4>
                            )}
                            <div className="space-y-1">
                                {group.items.filter(i => i.visible).map(renderLink)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toggle Collapse Button (Desktop only) */}
                <div className="hidden md:flex p-3 border-t">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex w-full items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                </div>

                {/* User Profile & Logout footer */}
                <div className="border-t p-3 shrink-0">
                    <Link
                        href="/dashboard/profile"
                        className={cn(
                            "flex items-center gap-3 mb-2 rounded-lg py-2 transition-colors hover:bg-slate-50 cursor-pointer",
                            isCollapsed ? "px-0 justify-center" : "px-3"
                        )}
                        title={isCollapsed ? "Profil" : undefined}
                    >
                        <img
                            src={userData?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.full_name || 'U'}`}
                            alt={userData?.full_name || "Utilisateur"}
                            className="h-9 w-9 shrink-0 rounded-full bg-slate-100 object-cover"
                        />
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {userData?.full_name || "Chargement..."}
                                </p>
                                <p className="text-xs text-slate-500 capitalize truncate">
                                    {userData?.role || ""}
                                </p>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={logout}
                        title={isCollapsed ? "Se déconnecter" : undefined}
                        className={cn(
                            "flex items-center rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600",
                            isCollapsed ? "w-full justify-center px-0" : "w-full gap-3 px-3"
                        )}
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>Déconnexion</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
