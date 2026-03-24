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
    X,
    Activity,
    FolderOpen,
    Database,
    Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();
    const { user, userData, companyData, logout } = useAuth();
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

    // Calcul XP & Niveau
    const getLevelInfo = (xp: number = 0) => {
        const levels = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];
        let level = 1;
        let currentLevelXp = 0;
        let nextLevelXp = 50;

        for (let i = 0; i < levels.length; i++) {
            if (xp >= levels[i]) {
                level = i + 1;
                currentLevelXp = levels[i];
                nextLevelXp = levels[i + 1] || levels[i] + 1000;
            } else {
                break;
            }
        }

        const progress = Math.min(100, Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));
        return { level, progress, xp, nextLevelXp };
    };

    const isManagerOrAdmin = userData?.role === "admin" || userData?.role === "manager";
    const levelInfo = getLevelInfo(userData?.xp || 0);
    const gamificationEnabled = companyData?.gamification_enabled !== false;

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
                { title: "Documents", href: "/dashboard/documents", icon: FolderOpen, visible: true },
                { title: "Data Center", href: "/dashboard/datacenter", icon: Database, visible: true },
                { title: "Rapports", href: "/dashboard/reports", icon: FileText, visible: true },
                { title: "Support", href: "/dashboard/support", icon: LifeBuoy, visible: true },
                { title: "Équipe", href: "/dashboard/team", icon: Users, visible: isManagerOrAdmin },
                { title: "Suivi d'exécution", href: "/dashboard/supervision", icon: Activity, visible: isManagerOrAdmin },
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
                {/* App Logo/Header */}
                <div className="flex h-16 items-center px-4 md:px-6 border-b shrink-0 relative">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900 overflow-hidden">
                        <Target className="h-6 w-6 text-primary shrink-0" />
                        {!isCollapsed && <span className="truncate mt-0.5">Faucus</span>}
                    </Link>

                    {/* Desktop Toggle Button on the right edge */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 focus:outline-none z-50 transition-transform"
                    >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </button>
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

                {/* User Profile & Logout footer */}
                <div className="border-t p-3 shrink-0">
                    <Link
                        href="/dashboard/profile"
                        className={cn(
                            "flex items-center gap-3 mb-2 rounded-xl py-2 transition-colors hover:bg-slate-50 cursor-pointer overflow-hidden border border-transparent hover:border-slate-100",
                            isCollapsed ? "px-0 justify-center" : "px-3"
                        )}
                        title={isCollapsed ? "Profil" : undefined}
                    >
                        <div className="relative shrink-0 flex items-center justify-center h-10 w-10">
                            {gamificationEnabled && (
                                <>
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-200/50"
                                            strokeWidth="3"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-amber-400 transition-all duration-1000 ease-out"
                                            strokeDasharray={`${Math.max(1, levelInfo.progress)}, 100`}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                </>
                            )}
                            <img
                                src={userData?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.full_name || 'U'}`}
                                alt={userData?.full_name || "Utilisateur"}
                                className="h-8 w-8 rounded-full object-cover z-10 border-[1.5px] border-white bg-slate-50"
                            />
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 truncate flex items-center">
                                    <span className="truncate">{userData?.full_name || "Chargement..."}</span>
                                    {gamificationEnabled && userData?.current_streak > 0 && (
                                        <span className="ml-1.5 flex items-center text-orange-500 text-[9px] bg-orange-50 px-1 rounded-sm border border-orange-100">
                                            <Flame className="w-2.5 h-2.5 mr-0.5 fill-orange-500" />
                                            {userData.current_streak}
                                        </span>
                                    )}
                                </p>
                                {gamificationEnabled && (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 shadow-sm">
                                            LVL {levelInfo.level}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {levelInfo.xp} / {levelInfo.nextLevelXp} XP
                                        </span>
                                    </div>
                                )}
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
