"use client";

import { useEffect, useState } from "react";
import { Sun, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";

export function AstralClock({ className }: { className?: string }) {
    const [progress, setProgress] = useState(0); // 0 to 1
    const [isDayTime, setIsDayTime] = useState(true);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const totalMinutes = hours * 60 + minutes;

            // Define "Day" as roughly 6 AM to 8 PM (6:00 to 20:00)
            const dayStart = 6 * 60; // 360 mins
            const dayEnd = 20 * 60; // 1200 mins
            const dayDuration = dayEnd - dayStart;

            if (totalMinutes >= dayStart && totalMinutes <= dayEnd) {
                // Daytime
                setIsDayTime(true);
                const p = (totalMinutes - dayStart) / dayDuration;
                setProgress(Math.max(0, Math.min(1, p)));
            } else {
                // Nighttime
                setIsDayTime(false);
                let nightProg;
                // Night is 20:00 to 6:00
                if (totalMinutes > dayEnd) {
                    nightProg = (totalMinutes - dayEnd) / ((24 * 60) - dayDuration);
                } else {
                    nightProg = ((24 * 60 - dayEnd) + totalMinutes) / ((24 * 60) - dayDuration);
                }
                setProgress(Math.max(0, Math.min(1, nightProg)));
            }
        };

        calculateTime();
        // Update every minute
        const interval = setInterval(calculateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Mapping progress (0 to 1) to an arc from -90deg (left) to 90deg (right)
    const angle = progress * 180 - 90;

    return (
        <div className={cn("relative h-24 w-full max-w-[200px] overflow-hidden flex items-end justify-center", className)}>
            {/* The Arc */}
            <div className="absolute top-0 left-1/2 -ml-24 w-48 h-48 rounded-full border-2 border-slate-200 border-dashed" />

            {/* The Astral Body Container (Rotates around center) */}
            <div
                className="absolute top-0 left-1/2 -ml-24 w-48 h-48"
                style={{
                    transform: `rotate(${angle}deg)`,
                    transition: "transform 1s ease-in-out",
                    transformOrigin: "center center"
                }}
            >
                {/* The Astral Body (Sun or Moon) */}
                <div
                    className={cn(
                        "absolute -top-4 left-1/2 -ml-4 w-8 h-8 rounded-full flex items-center justify-center shadow-md",
                        isDayTime ? "bg-amber-100 text-amber-500 shadow-amber-200/50" : "bg-indigo-100 text-indigo-500 shadow-indigo-200/50"
                    )}
                    style={{
                        // Counter-rotate to keep icon upright
                        transform: `rotate(${-angle}deg)`
                    }}
                >
                    {isDayTime ? <Sun className="h-5 w-5" /> : <MoonStar className="h-4 w-4" />}
                </div>
            </div>

            {/* Horizon Line */}
            <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>
    );
}
