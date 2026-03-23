"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";

export function useDocumentPiP() {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    const requestPiP = useCallback(async (options?: { width?: number; height?: number }) => {
        if (!("documentPictureInPicture" in window)) return null;

        try {
            // @ts-ignore
            const pip = await window.documentPictureInPicture.requestWindow(options);
            setPipWindow(pip);

            pip.addEventListener("pagehide", () => {
                setPipWindow(null);
            });

            return pip;
        } catch (error) {
            console.error("Failed to open Document PiP:", error);
            throw error;
        }
    }, []);

    const closePiP = useCallback(() => {
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        }
    }, [pipWindow]);

    return { pipWindow, requestPiP, closePiP };
}

interface DocumentPiPPortalProps {
    pipWindow: Window;
    children: React.ReactNode;
    title?: string;
}

export function DocumentPiPPortal({ pipWindow, children, title = "FocusBoard Tasks" }: DocumentPiPPortalProps) {
    const container = useMemo(() => document.createElement("div"), []);

    useEffect(() => {
        pipWindow.document.title = title;

        const copyStyles = () => {
            // Prevent duplicating styles if already injected
            if (pipWindow.document.head.querySelector('style') || pipWindow.document.head.querySelector('link[rel="stylesheet"]')) {
                return;
            }
            document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
                pipWindow.document.head.appendChild(link.cloneNode(true));
            });
            document.querySelectorAll("style").forEach((style) => {
                pipWindow.document.head.appendChild(style.cloneNode(true));
            });
        };
        copyStyles();

        pipWindow.document.body.className = document.body.className;
        container.className = "h-full w-full bg-transparent overflow-hidden";
        pipWindow.document.body.style.margin = "0";
        pipWindow.document.body.style.height = "100vh";
        pipWindow.document.body.style.width = "100vw";

        pipWindow.document.body.appendChild(container);

        return () => {
            if (pipWindow.document.body.contains(container)) {
                pipWindow.document.body.removeChild(container);
            }
        };
    }, [pipWindow, container, title]);

    return createPortal(children, container);
}
