"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckSquare, Square, X } from "lucide-react";
import { useState, useEffect } from "react";
import { DLC, DLC_NAMES } from "@/data/types";
import { createPortal } from "react-dom";

interface BulkDLCPromptModalProps {
    isOpen: boolean;
    onConfirm: (ownership: Record<DLC, boolean>) => void;
    onCancel: () => void;
    existingOwnership: Record<string, boolean>;
}

const CHECKABLE_DLCS: DLC[] = ["sotv", "sots", "ac"];

export function BulkDLCPromptModal({
    isOpen,
    onConfirm,
    onCancel,
    existingOwnership,
}: BulkDLCPromptModalProps) {
    const [ownership, setOwnership] = useState<Record<string, boolean>>({
        ...existingOwnership,
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggle = (dlc: DLC) => {
        setOwnership((prev) => ({
            ...prev,
            [dlc]: !prev[dlc],
        }));
    };

    if (!mounted || typeof document === "undefined") return null;

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
                        onClick={onCancel}
                        style={{ zIndex: -1 }}
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
                        <div className="bg-ror-bg-main/50 p-4 border-b border-ror-border">
                            <h3 className="text-ror-text-main font-display uppercase tracking-wider text-sm">
                                Unlock All - DLC Configuration
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-ror-text-dim text-sm">
                                Please confirm which DLCs you own so we can unlock the correct achievements.
                            </p>

                            <div className="space-y-2">
                                {CHECKABLE_DLCS.map((dlc) => (
                                    <button
                                        key={dlc}
                                        type="button"
                                        onClick={() => toggle(dlc)}
                                        className={`w-full flex items-center gap-3 p-3 border transition-all ${ownership[dlc]
                                                ? "bg-ror-bg-main border-ror-uncommon/50"
                                                : "bg-transparent border-ror-border/30 hover:bg-ror-bg-main/30"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 flex items-center justify-center rounded border ${ownership[dlc]
                                                    ? "bg-ror-uncommon border-ror-uncommon text-ror-bg-main"
                                                    : "border-ror-text-muted text-transparent"
                                                }`}
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span
                                            className={`text-sm uppercase tracking-wider ${ownership[dlc] ? "text-ror-text-main" : "text-ror-text-muted"
                                                }`}
                                        >
                                            {DLC_NAMES[dlc]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-ror-bg-main/30 border-t border-ror-border flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="ror-button px-4 py-2 bg-transparent border-ror-border text-ror-text-muted hover:text-ror-text-main text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => onConfirm(ownership as Record<DLC, boolean>)}
                                className="ror-button px-6 py-2 bg-ror-uncommon text-ror-bg-main border-ror-uncommon hover:brightness-110 text-xs uppercase tracking-wider font-bold"
                            >
                                Confirm & Unlock
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
