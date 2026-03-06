"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const TextParallaxContent = ({
    imgUrl,
    subheading,
    heading,
    children,
}: {
    imgUrl: string;
    subheading: string;
    heading: string;
    children: React.ReactNode;
}) => {
    return (
        <div
            style={{
                paddingLeft: IMG_PADDING,
                paddingRight: IMG_PADDING,
            }}
        >
            <div className="relative h-[150vh]">
                <StickyImage imgUrl={imgUrl} />
                <OverlayCopy heading={heading} subheading={subheading} />
            </div>
            {children}
        </div>
    );
};

const IMG_PADDING = 12;

const StickyImage = ({ imgUrl }: { imgUrl: string }) => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["end end", "end start"],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

    return (
        <motion.div
            style={{
                backgroundImage: `url(${imgUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: `calc(100vh - ${IMG_PADDING * 2}px)`,
                top: IMG_PADDING,
                scale,
            }}
            ref={targetRef}
            className="sticky z-0 overflow-hidden rounded-[32px] sm:rounded-[40px]"
        >
            <motion.div
                className="absolute inset-0 bg-neutral-950/60"
                style={{
                    opacity,
                }}
            />
        </motion.div>
    );
};

const OverlayCopy = ({
    subheading,
    heading,
}: {
    subheading: string;
    heading: string;
}) => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
    const opacity = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);

    return (
        <motion.div
            style={{
                y,
                opacity,
            }}
            ref={targetRef}
            className="absolute left-0 top-0 flex h-screen w-full flex-col items-center justify-center text-white px-4"
        >
            <p className="mb-2 text-center text-xl md:mb-4 md:text-2xl font-bold uppercase tracking-widest text-[#2E8B57]">
                {subheading}
            </p>
            <p className="text-center text-5xl font-black md:text-7xl leading-tight tracking-tight">
                {heading}
            </p>
        </motion.div>
    );
};
