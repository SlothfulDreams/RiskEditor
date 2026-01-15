"use client";

import { AnimatePresence, motion } from "framer-motion";
import { VirtuosoGrid } from "react-virtuoso";
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
  toggleLogbookEntry,
  unlockAllLogbook,
  lockAllLogbook,
  toggleAchievement,
} from "@/lib/save-operations";
import { LogbookCard } from "./LogbookCard";
import { DLCPromptModal } from "./DLCPromptModal";
import { BulkDLCPromptModal } from "./BulkDLCPromptModal";
import { getAchievementForSurvivorLogbook } from "@/lib/survivor-achievement-mapping";

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
  "drones",
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

const GridContainer = ({ children, ...props }: any) => (
  <div
    {...props}
    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
  >
    {children}
  </div>
);

const ItemContainer = ({ children, ...props }: any) => (
  <div {...props} className="h-full relative transition-all duration-300">
    {children}
  </div>
);

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
  const [selectedStatus, setSelectedStatus] = useState<"all" | "discovered" | "missing">("all");

  // DLC Prompt Logic
  const [dlcOwnership, setDlcOwnership] = useState<Record<string, boolean>>({
    base: true,
  });
  const [pendingEntry, setPendingEntry] = useState<LogbookEntry | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isBulkPromptOpen, setIsBulkPromptOpen] = useState(false);

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
    // Status filter
    const isUnlocked = isLogbookEntryUnlocked(saveData, entry);
    if (selectedStatus === "discovered" && !isUnlocked) return false;
    if (selectedStatus === "missing" && isUnlocked) return false;
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
      // Locking: Just toggle off logic (standard)
      if (!enabled) {
        onSaveDataChange(toggleLogbookEntry(saveData, entry, false));
        return;
      }

      // Unlocking: Check DLC
      if (entry.dlc !== "base") {
        const isOwned = dlcOwnership[entry.dlc];
        if (isOwned === undefined) {
          // Unknown ownership -> Prompt
          setPendingEntry(entry);
          setIsPromptOpen(true);
          return;
        }
        if (isOwned === false) {
          // Known Not Owned -> Unlock visual logbook only (as requested "unlock logbook") 
          // but skip linked achievement to respect ownership?
          // The user said: "mở khoá survivor trong logbooks sẽ tự tích thêm vào phần achievements ... 
          // (thêm cảnh báo ... bạn có dlc này ko) có thì sẽ ko hỏi thêm nữa".
          // This implies positive flow. If negative, standard logbook unlock is safe.
          onSaveDataChange(toggleLogbookEntry(saveData, entry, true));
          return;
        }
      }

      // Proceed with unlock (Base or Owned DLC)
      let newData = toggleLogbookEntry(saveData, entry, true);

      // Link Linked Achievement (for Survivors)
      if (entry.category === "survivors") {
        const achievement = getAchievementForSurvivorLogbook(entry);
        if (achievement) {
          newData = toggleAchievement(newData, achievement.achievement, true);
        }
      }
      onSaveDataChange(newData);
    },
    [saveData, onSaveDataChange, dlcOwnership],
  );

  const confirmPendingEntry = useCallback(() => {
    if (!pendingEntry) return;

    // User confirmed ownership
    setDlcOwnership((prev) => ({ ...prev, [pendingEntry.dlc]: true }));
    setIsPromptOpen(false);

    // Proceed unlock with ownership now TRUE
    let newData = toggleLogbookEntry(saveData, pendingEntry, true);
    if (pendingEntry.category === "survivors") {
      const achievement = getAchievementForSurvivorLogbook(pendingEntry);
      if (achievement) {
        newData = toggleAchievement(newData, achievement.achievement, true);
      }
    }
    onSaveDataChange(newData);
    setPendingEntry(null);
  }, [pendingEntry, saveData, onSaveDataChange]);

  const denyPendingEntry = useCallback(() => {
    if (!pendingEntry) return;

    // User denied ownership
    setDlcOwnership((prev) => ({ ...prev, [pendingEntry.dlc]: false }));
    setIsPromptOpen(false);

    // Proceed unlock visual only (no achievement link)
    onSaveDataChange(toggleLogbookEntry(saveData, pendingEntry, true));
    setPendingEntry(null);
  }, [pendingEntry, saveData, onSaveDataChange]);

  const handleUnlockAllClick = useCallback(() => {
    // Check if we need to ask for any DLCs
    const unknowns = ["sotv", "sots", "ac"].some(
      (dlc) => dlcOwnership[dlc] === undefined,
    );

    if (unknowns) {
      setIsBulkPromptOpen(true);
    } else {
      // All known, proceed
      performBulkUnlock(dlcOwnership);
    }
  }, [dlcOwnership]);


  const performBulkUnlock = useCallback(
    (ownershipObj: Record<string, boolean>) => {
      // 1. Unlock All Logbook Entries (filtered by DLC)
      let newData = unlockAllLogbook(saveData, ownershipObj);

      // 2. Unlock Linked Achievements for Survivors (manually for now as unlockAllLogbook doesn't do survivors<->achievements)
      // Iterate all survivor entries
      for (const entry of logbookEntries) {
        if (
          entry.category === "survivors" &&
          (entry.dlc === "base" || ownershipObj[entry.dlc])
        ) {
          const achievement = getAchievementForSurvivorLogbook(entry);
          if (achievement) {
            // We need to confirm if we should unlock?
            // unlockAllLogbook unlocked the log entry.
            // We should unlock the achievement too.
            newData = toggleAchievement(newData, achievement.achievement, true);
          }
        }
      }

      onSaveDataChange(newData);
    },
    [saveData, onSaveDataChange],
  );

  const handleBulkConfirm = useCallback(
    (newOwnership: Record<string, boolean>) => {
      setDlcOwnership((prev) => ({ ...prev, ...newOwnership }));
      setIsBulkPromptOpen(false);
      performBulkUnlock({ ...dlcOwnership, ...newOwnership });
    },
    [dlcOwnership, performBulkUnlock],
  );

  const handleLockAll = useCallback(() => {
    onSaveDataChange(lockAllLogbook(saveData));
  }, [saveData, onSaveDataChange]);

  return (
    <div className="flex flex-col gap-4 relative">
      <DLCPromptModal
        isOpen={isPromptOpen}
        dlc={pendingEntry?.dlc || null}
        onConfirm={confirmPendingEntry}
        onDeny={denyPendingEntry}
      />
      <BulkDLCPromptModal
        isOpen={isBulkPromptOpen}
        onConfirm={handleBulkConfirm}
        onCancel={() => setIsBulkPromptOpen(false)}
        existingOwnership={dlcOwnership}
      />

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
            onClick={handleUnlockAllClick}
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
                    ${selectedDLC === dlc
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

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-ror-text-dim uppercase tracking-widest hidden sm:block">
                STATUS
              </span>
              <div className="flex gap-1.5">
                {(["all", "discovered", "missing"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`
                      px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all whitespace-nowrap
                      ${selectedStatus === status
                        ? status === "discovered"
                          ? "bg-ror-uncommon text-ror-bg-main border-ror-uncommon font-bold"
                          : status === "missing"
                            ? "bg-ror-legendary text-ror-bg-main border-ror-legendary font-bold"
                            : "bg-ror-text-muted text-ror-bg-main border-ror-text-muted font-bold"
                        : "bg-transparent text-ror-text-dim border-ror-border/50 hover:text-ror-text-main hover:border-ror-border"
                      }
                    `}
                  >
                    {status === "all" ? "ALL" : status === "discovered" ? "✓ FOUND" : "✗ MISSING"}
                  </button>
                ))}
              </div>
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
                  ${selectedCategory === cat
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
          {" · "}
          <span className="text-ror-legendary">{filteredEntries.length - unlockedInView}</span> Missing
        </span>
      </motion.div>

      {/* Grid */}
      {filteredEntries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full py-20 text-center text-ror-text-dim"
        >
          NO DATA FOUND
        </motion.div>
      ) : (
        <div style={{ height: "calc(100vh - 320px)", width: "100%" }}>
          <VirtuosoGrid
            style={{ height: "100%" }}
            totalCount={filteredEntries.length}
            overscan={200}
            components={{
              List: GridContainer,
              Item: ItemContainer,
            }}
            itemContent={(index) => {
              const entry = filteredEntries[index];
              return (
                <div className="h-full">
                  <LogbookCard
                    entry={entry}
                    isUnlocked={isLogbookEntryUnlocked(saveData, entry)}
                    onToggle={handleToggleEntry}
                    linkedChallengeCount={getChallengeCountForLogbookEntry(
                      entry.id,
                    )}
                  />
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
