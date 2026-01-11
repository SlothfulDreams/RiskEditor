"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Book, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { logbookEntries } from "@/data/logbook-entries";
import type {
  DLC,
  LogbookCategory,
  LogbookEntry,
  SaveData,
} from "@/data/types";
import { DLC_NAMES, LOGBOOK_CATEGORY_NAMES } from "@/data/types";
import { getChallengeCountForLogbookEntry } from "@/lib/challenge-logbook-mapping";
import {
  calculateLogbookStats,
  isLogbookEntryUnlocked,
  lockAllLogbook,
  toggleLogbookEntry,
  unlockAllLogbook,
} from "@/lib/save-operations";
import { LogbookCard } from "./LogbookCard";

interface LogbookEditorProps {
  saveData: SaveData;
  onSaveDataChange: (saveData: SaveData) => void;
}

const categories: (LogbookCategory | "all")[] = [
  "all",
  "monsters",
  "environments",
  "survivors",
  "items",
  "equipment",
];

const dlcs: (DLC | "all")[] = ["all", "base", "sotv", "sots", "ac"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export function LogbookEditor({
  saveData,
  onSaveDataChange,
}: LogbookEditorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    LogbookCategory | "all"
  >("all");
  const [selectedDLC, setSelectedDLC] = useState<DLC | "all">("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const stats = calculateLogbookStats(saveData);

  // Filter entries
  const filteredEntries = logbookEntries.filter((entry) => {
    if (selectedCategory !== "all" && entry.category !== selectedCategory)
      return false;
    if (selectedDLC !== "all" && entry.dlc !== selectedDLC) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.description?.toLowerCase().includes(q) ||
        entry.unlockId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unlockedInView = filteredEntries.filter((entry) =>
    isLogbookEntryUnlocked(saveData, entry),
  ).length;

  const handleToggleEntry = useCallback(
    (entry: LogbookEntry, enabled: boolean) => {
      onSaveDataChange(toggleLogbookEntry(saveData, entry, enabled));
    },
    [saveData, onSaveDataChange],
  );

  const handleUnlockAll = useCallback(() => {
    onSaveDataChange(unlockAllLogbook(saveData));
  }, [saveData, onSaveDataChange]);

  const handleLockAll = useCallback(() => {
    onSaveDataChange(lockAllLogbook(saveData));
  }, [saveData, onSaveDataChange]);

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Stats Bar with Bulk Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ror-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-ror-bg-main border border-ror-border flex items-center justify-center">
            <Book size={18} className="text-ror-text-main" />
          </div>
          <div>
            <p className="text-ror-text-main font-display text-sm uppercase tracking-wider">
              Logbook Progress
            </p>
            <p className="text-ror-text-muted text-xs">
              <span className="text-ror-uncommon">{stats.unlockedEntries}</span>{" "}
              / {stats.totalEntries} entries discovered
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleUnlockAll}
            className="ror-button text-[10px] py-2 px-4 bg-ror-uncommon text-ror-bg-main border-ror-uncommon hover:brightness-110 font-bold tracking-wider"
          >
            UNLOCK ALL
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleLockAll}
            className="ror-button text-[10px] py-2 px-4 bg-ror-legendary text-ror-bg-main border-ror-legendary hover:brightness-110 font-bold tracking-wider"
          >
            LOCK ALL
          </motion.button>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ror-card p-5 flex flex-col gap-5 sticky top-0 z-20 bg-ror-bg-main/95 backdrop-blur-md border-b border-ror-border shadow-lg"
      >
        {/* Top Row: Search + DLC Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ror-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logbook..."
              className="w-full !pl-10 pr-8 py-2.5 text-sm ror-input bg-ror-bg-panel/50 focus:bg-ror-bg-panel"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ror-text-muted hover:text-ror-text-main"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* DLCs */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-ror-text-dim uppercase tracking-widest hidden sm:block">
              DLC
            </span>
            <div className="flex gap-1.5">
              {dlcs.map((dlc) => (
                <button
                  type="button"
                  key={dlc}
                  onClick={() => setSelectedDLC(dlc)}
                  className={`
                    px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all whitespace-nowrap
                    ${
                      selectedDLC === dlc
                        ? "bg-ror-orange-accent text-ror-bg-main border-ror-orange-accent font-bold"
                        : "bg-transparent text-ror-text-dim border-ror-border/50 hover:text-ror-text-main hover:border-ror-border"
                    }
                  `}
                >
                  {dlc === "all"
                    ? "ALL"
                    : DLC_NAMES[dlc]
                        .replace("Survivors of the Void", "SOTV")
                        .replace("Seekers of the Storm", "SOTS")
                        .replace("Alloyed Collective", "AC")
                        .replace("Base Game", "BASE")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Category Filters */}
        <div className="flex items-center gap-4 pt-3 border-t border-ror-border/30">
          <span className="text-[9px] text-ror-text-dim uppercase tracking-widest hidden sm:block">
            Category
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-4 py-1.5 text-[10px] uppercase tracking-wider border transition-all whitespace-nowrap
                  ${
                    selectedCategory === cat
                      ? "bg-ror-text-muted text-ror-bg-main border-ror-text-muted font-bold"
                      : "bg-transparent text-ror-text-muted border-ror-border/50 hover:border-ror-text-dim hover:bg-ror-bg-panel"
                  }
                `}
              >
                {cat === "all" ? "ALL" : LOGBOOK_CATEGORY_NAMES[cat]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between px-2"
      >
        <span className="text-ror-text-dim text-xs tracking-wider uppercase">
          Showing {filteredEntries.length} Entries
        </span>
        <span className="text-ror-text-dim text-xs tracking-wider uppercase">
          <span className="text-ror-uncommon">{unlockedInView}</span> Discovered
        </span>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-4 custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <LogbookCard
                entry={entry}
                isUnlocked={isLogbookEntryUnlocked(saveData, entry)}
                onToggle={handleToggleEntry}
                linkedChallengeCount={getChallengeCountForLogbookEntry(
                  entry.id,
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center text-ror-text-dim"
          >
            NO DATA FOUND
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
