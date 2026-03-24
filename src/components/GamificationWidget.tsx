"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Flame, Trophy, Star } from "lucide-react";

export function GamificationWidget() {
    const { userData, companyData } = useAuth();
    if (!userData || companyData?.gamification_enabled === false) return null;

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
            } else { break; }
        }
        const progress = Math.min(100, Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));
        return { level, progress, xp, nextLevelXp, xpNeeded: nextLevelXp - xp };
    };

    const levelInfo = getLevelInfo(userData.xp || 0);

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm overflow-hidden relative min-h-[180px]">
            {/* Background design */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-50 pointer-events-none text-slate-50">
                <Trophy className="w-32 h-32" />
            </div>

            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 relative z-10 text-slate-900">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Tableau d&apos;Honneur
            </h2>

            <div className="flex items-center gap-4 relative z-10 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center flex-col shrink-0 text-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Niv</span>
                    <span className="text-2xl font-black leading-none">{levelInfo.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1 text-slate-900">
                        <span className="text-sm font-semibold truncate pr-2">{levelInfo.xp} XP total</span>
                        <span className="text-xs text-slate-500 font-medium shrink-0">{levelInfo.xpNeeded} XP restants</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden">
                        <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${levelInfo.progress}%` }}></div>
                    </div>
                </div>
            </div>

            {userData.current_streak > 0 && (
                <div className="inline-flex items-center bg-orange-50 rounded-lg px-3 py-2 border border-orange-100 relative z-10">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500 mr-2 shrink-0" />
                    <div>
                        <div className="text-[10px] text-orange-600/70 font-bold uppercase tracking-wider">Série en cours</div>
                        <div className="text-sm font-bold text-orange-900">{userData.current_streak} Jours de Focus</div>
                    </div>
                </div>
            )}
        </div>
    );
}
