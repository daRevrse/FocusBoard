"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface AnimatedCounterProps {
    from?: number;
    to: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
}

export function AnimatedCounter({
    from = 0,
    to,
    duration = 2,
    prefix = "",
    suffix = "",
}: AnimatedCounterProps) {
    const [count, setCount] = useState(from);
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            let startTime: number;
            let animationFrame: number;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

                // Easing function: easeOutExpo
                const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

                setCount(Math.floor(easeOutExpo * (to - from) + from));

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };

            animationFrame = requestAnimationFrame(animate);

            return () => cancelAnimationFrame(animationFrame);
        }
    }, [isInView, from, to, duration]);

    return (
        <span ref={ref}>
            {prefix}
            {count}
            {suffix}
        </span>
    );
}
