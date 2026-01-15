"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { DLC, DLC_NAMES } from "@/data/types";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface DLCPromptModalProps {
    isOpen: boolean;
    dlc: DLC | null;
    onConfirm: () => void;
    onDeny: () => void;
}

export function DLCPromptModal({
    isOpen,
    dlc,
    onConfirm,
    onDeny,
}: DLCPromptModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === "undefined") return null;
    if (!dlc) return null;

    const dlcName = DLC_NAMES[dlc];

    // We render the Portal conditionally inside AnimatePresence?
    // No, AnimatePresence must be direct parent of motion components.
    // Best practice: Render Portal, put AnimatePresence inside.

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{
                        zIndex: 2147483647, // Max Safe Integer
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onDeny}
                        style={{ zIndex: -1 }} // Behind modal content
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative border border-ror-border shadow-2xl w-full max-w-md overflow-hidden"
                        style={{
                            backgroundColor: "#1e2129", // Hardcoded ror-bg-panel
                            zIndex: 2147483647,
                        }}
                    >
                        {/* Header */}
                        <div className="bg-ror-bg-main/50 p-4 border-b border-ror-border flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                <AlertTriangle size={16} className="text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-ror-text-main font-display uppercase tracking-wider text-sm">
                                    DLC Required
                                </h3>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-ror-text-dim text-sm leading-relaxed">
                                You are unlocking content from <span className="text-ror-text-main font-bold">{dlcName}</span>.
                            </p>
                            <p className="text-ror-text-dim text-sm leading-relaxed">
                                To ensure your save file works correctly, we need to know if you own this DLC.
                                If you do, we will also unlock the corresponding achievements.
                            </p>

                            <div className="p-3 bg-ror-bg-main border border-ror-border/50 text-xs text-ror-text-muted italic">
                                Note: We will remember your choice for this session.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-ror-bg-main/30 border-t border-ror-border flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onDeny}
                                className="ror-button px-4 py-2 bg-transparent border-ror-border text-ror-text-muted hover:text-ror-text-main hover:bg-ror-bg-panel text-xs uppercase tracking-wider flex items-center gap-2"
                            >
                                <X size={14} />
                                No, I don't
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="ror-button px-4 py-2 bg-ror-uncommon/10 border-ror-uncommon text-ror-uncommon hover:bg-ror-uncommon hover:text-ror-bg-main text-xs uppercase tracking-wider flex items-center gap-2 font-bold transition-all"
                            >
                                <Check size={14} />
                                Yes, I Own It
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
