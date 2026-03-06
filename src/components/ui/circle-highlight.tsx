"use client";

import React from "react";
import { motion } from "framer-motion";

export const CircleHighlight = ({
    children,
    color = "#2E8B57", // Faucus green by default
    delay = 0.5,
    className,
}: {
    children: React.ReactNode;
    color?: string;
    delay?: number;
    className?: string;
}) => {
    return (
        <span className={`relative inline-block ${className || ""}`}>
            <span className="relative z-10">{children}</span>
            <svg
                viewBox="0 0 286 73"
                fill="none"
                className="absolute -left-4 -right-4 top-1/2 -translate-y-1/2 w-[calc(100%+2rem)] h-auto pointer-events-none z-0"
                preserveAspectRatio="none"
            >
                <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        duration: 1.25,
                        ease: "easeInOut",
                        delay: delay,
                    }}
                    d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                    stroke={color}
                    strokeWidth="3"
                />
            </svg>
        </span>
    );
};
