"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StickyCard {
    id: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColor: string;
    textColor: string;
    buttonLabel: string;
    buttonColor: string;
}

interface StickyScrollCardsProps {
    cards: StickyCard[];
}

export const StickyScrollCards: React.FC<StickyScrollCardsProps> = ({ cards }) => {
    return (
        <div className="relative">
            {cards.map((card, index) => (
                <StickyCard key={card.id} card={card} index={index} totalCards={cards.length} />
            ))}
        </div>
    );
};

const StickyCard = ({ card, index, totalCards }: { card: StickyCard; index: number; totalCards: number }) => {
    return (
        <motion.div
            style={{
                top: `calc(10% + ${index * 30}px)`, // Slight offset for each stacked card
                zIndex: index + 1,
            }}
            className="sticky w-full min-h-[500px] flex items-center justify-center py-16 px-4"
        >
            <div
                className={`relative w-full max-w-7xl mx-auto rounded-[40px] p-12 sm:p-20 shadow-2xl flex flex-col items-center text-center ${card.bgColor} ${card.textColor}`}
            >
                <div className="mb-8">
                    {card.icon}
                </div>

                <h2 className="text-4xl sm:text-7xl font-black mb-6 tracking-tight">
                    {card.title}
                </h2>

                <p className="max-w-2xl text-xl sm:text-2xl font-medium opacity-80 leading-relaxed mb-10">
                    {card.description}
                </p>

                <Button
                    className={`h-auto py-4 px-10 rounded-xl text-lg font-bold shadow-lg transition-transform hover:scale-105 ${card.buttonColor}`}
                >
                    {card.buttonLabel}
                </Button>
            </div>
        </motion.div>
    );
};
