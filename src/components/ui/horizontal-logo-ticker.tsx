"use client";

import React from "react";
import { motion } from "framer-motion";

const logos = [
    "Acme Corp",
    "Quantum",
    "Globex",
    "Soylent",
    "Initech",
    "Umbrella",
    "Stark Ind.",
    "Wayne Ent.",
];

export const HorizontalLogoTicker = () => {
    return (
        <div className="w-full bg-white py-12 overflow-hidden border-t border-b border-slate-100 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Ils ont arrêté de deviner et commencé à mesurer
                </p>
            </div>

            <div className="flex relative overflow-hidden group">
                {/* Left Gradient Mask */}
                <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10"></div>

                <motion.div
                    animate={{
                        x: ["0%", "-50%"],
                    }}
                    transition={{
                        ease: "linear",
                        duration: 20,
                        repeat: Infinity,
                    }}
                    className="flex flex-none gap-16 pr-16"
                >
                    {/* Duplicate logos for infinite scroll effect */}
                    {[...logos, ...logos].map((logo, index) => (
                        <div
                            key={index}
                            className="flex-none flex items-center justify-center text-slate-300 font-extrabold text-2xl tracking-tighter hover:text-slate-400 transition-colors cursor-default"
                        >
                            {logo}
                        </div>
                    ))}
                </motion.div>

                {/* Right Gradient Mask */}
                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10"></div>
            </div>
        </div>
    );
};
