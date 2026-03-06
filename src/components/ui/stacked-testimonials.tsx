"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Testimonial {
    id: number;
    quote: string;
    name: string;
    title: string;
    icon: React.ReactNode;
}

interface StackedTestimonialsProps {
    testimonials: Testimonial[];
    title?: string;
    description?: string;
    autoplayInterval?: number;
}

export const StackedTestimonials: React.FC<StackedTestimonialsProps> = ({
    testimonials,
    title = "Des équipes qui ont arrêté de deviner, et commencé à mesurer.",
    description = "Nos clients ont remplacé la complaisance par la performance. Découvrez comment l'Index de Performance a transformé leurs opérations.",
    autoplayInterval = 6000,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length);
        }, autoplayInterval);
        return () => clearInterval(interval);
    }, [testimonials.length, autoplayInterval]);

    return (
        <section className="py-24 sm:py-32 bg-white border-t border-slate-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Left Column: Text & Indicators */}
                    <div className="flex flex-col justify-center">
                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] leading-[1.1] mb-6">
                            {title}
                        </h2>
                        <p className="text-xl text-slate-500 mb-12 font-medium leading-relaxed max-w-lg">
                            {description}
                        </p>

                        {/* Pagination Indicators */}
                        <div className="flex gap-2 w-full max-w-sm">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    className="relative h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden cursor-pointer group"
                                    aria-label={`View testimonial ${index + 1}`}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-[#111827]"
                                        initial={{ width: "0%" }}
                                        animate={{
                                            width: activeIndex === index ? "100%" : activeIndex > index ? "100%" : "0%",
                                        }}
                                        transition={{
                                            duration: activeIndex === index ? autoplayInterval / 1000 : 0.3,
                                            ease: "linear",
                                        }}
                                    />
                                    {/* Hover effect bar */}
                                    <div className="absolute inset-0 bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Stacked Card Animation */}
                    <div className="relative h-[450px] sm:h-[400px] w-full perspective-1000">
                        <AnimatePresence mode="popLayout">
                            {testimonials.map((testimonial, index) => {
                                if (index !== activeIndex) return null;

                                return (
                                    <motion.div
                                        key={testimonial.id}
                                        initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }}
                                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                        className="absolute inset-0 bg-[#111827] text-white p-10 sm:p-12 rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col justify-between overflow-hidden"
                                    >
                                        {/* Decorative abstract shape in background */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                                        <div>
                                            <div className="mb-10 text-white/80">
                                                {testimonial.icon}
                                            </div>
                                            <p className="text-xl sm:text-2xl font-medium italic leading-relaxed text-slate-300">
                                                "{testimonial.quote}"
                                            </p>
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-slate-700/50">
                                            <div className="font-extrabold text-white text-lg">{testimonial.name}</div>
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{testimonial.title}</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Visual Stack Background Card (purely decorative) */}
                        <div className="absolute inset-0 bg-slate-900 rounded-[32px] sm:rounded-[40px] origin-bottom scale-y-95 scale-x-[0.98] translate-y-4 opacity-50 -z-10" />
                        <div className="absolute inset-0 bg-slate-800 rounded-[32px] sm:rounded-[40px] origin-bottom scale-y-90 scale-x-95 translate-y-8 opacity-25 -z-20" />
                    </div>

                </div>
            </div>
        </section>
    );
};
