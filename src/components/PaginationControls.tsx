import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationControlsProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4 py-6">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-ror-bg-panel/50 disabled:opacity-30 disabled:pointer-events-none text-ror-text-main transition-colors"
            >
                <ChevronLeft size={24} />
            </motion.button>

            <div className="flex items-center gap-2">
                <span className="text-sm font-display tracking-wider text-ror-text-dim">
                    PAGE
                </span>
                <div className="px-3 py-1 bg-ror-bg-panel border border-ror-border rounded min-w-[3rem] text-center font-mono text-ror-text-main">
                    {currentPage}
                </div>
                <span className="text-sm font-display tracking-wider text-ror-text-dim">
                    OF {totalPages}
                </span>
            </div>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-ror-bg-panel/50 disabled:opacity-30 disabled:pointer-events-none text-ror-text-main transition-colors"
            >
                <ChevronRight size={24} />
            </motion.button>
        </div>
    );
}
