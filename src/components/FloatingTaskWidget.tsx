"use client";

import { useState, useEffect } from "react";
import { ListTodo, ExternalLink, X, MoveDiagonal } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useDocumentPiP, DocumentPiPPortal } from "./DocumentPiPWindow";
import { WidgetTaskList } from "./WidgetTaskList";

export function FloatingTaskWidget() {
    const { pipWindow, requestPiP, closePiP } = useDocumentPiP();
    const [isSupported, setIsSupported] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        // Detect Document PiP Support strictly
        if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
            setIsSupported(true);
        }
    }, []);

    const detachWidget = async () => {
        setPopoverOpen(false); // Close the popover smoothly
        try {
            // Must be called synchronously within the click handler
            await requestPiP({ width: 380, height: 550 });
        } catch (e) {
            console.error("Could not open PiP", e);
        }
    };

    // If PiP is open, we display an inline subtle state indicator on the main screen
    if (pipWindow) {
        return (
            <>
                <DocumentPiPPortal
                    pipWindow={pipWindow}
                    title="Mes Tâches"
                >
                    <WidgetTaskList />
                </DocumentPiPPortal>

                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
                    <button
                        onClick={closePiP}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-full shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all active:scale-95 group"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Widget Détaché
                        <X className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                    <div className="absolute top-[-30px] right-0 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden lg:block">
                        Fermer le widget externe
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <button className="flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-full shadow-[0px_4px_16px_rgba(0,0,0,0.15)] hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group">
                        <ListTodo className="w-6 h-6 text-slate-100" />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-[360px] p-0 mb-2 border-slate-200 shadow-[0px_10px_30px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden bg-white"
                    align="end"
                    sideOffset={16}
                >
                    <div className="flex flex-col h-[500px]">
                        {/* Header fallback/action bar */}
                        {isSupported && (
                            <div className="flex justify-between items-center px-3 py-2 bg-slate-50 border-b border-slate-100">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aperçu rapide</span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        detachWidget();
                                    }}
                                    className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-white transition-colors hover:bg-primary px-2.5 py-1.5 rounded-full"
                                >
                                    <MoveDiagonal className="w-3 h-3" />
                                    <span>Détacher (Widget OS)</span>
                                </button>
                            </div>
                        )}

                        {/* Task List takes remaining height */}
                        <div className="flex-1 overflow-hidden relative">
                            <WidgetTaskList />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
