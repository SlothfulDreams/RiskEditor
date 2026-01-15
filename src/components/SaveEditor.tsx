"use client";

import { AnimatePresence, motion } from "framer-motion";
import { VirtuosoGrid } from "react-virtuoso";
import {
  Book,
  Download,
  RotateCcw,
  Search,
  Trophy,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { challenges } from "@/data/challenges";
import type {
  ChallengeCategory,
  DLC,
  RawUserProfile,
  SaveData,
} from "@/data/types";
import { CATEGORY_NAMES, DLC_NAMES } from "@/data/types";
import { getLogbookCountForChallenge } from "@/lib/challenge-logbook-mapping";
import {
  calculateLogbookStats,
  calculateSaveStats,
  generateModifiedXml,
  lockAll,
  toggleAchievement,
  unlockAll,
  updateCoins,
} from "@/lib/save-operations";
import { downloadFile } from "@/lib/utils";
import { ChallengeCard } from "./ChallengeCard";
import { CoinsEditor } from "./CoinsEditor";
import { LogbookEditor } from "./LogbookEditor";

import { BulkDLCPromptModal } from "./BulkDLCPromptModal";

interface SaveEditorProps {
  initialSaveData: SaveData;
  rawProfile: RawUserProfile;
  fileName: string;
  fileHandle?: FileSystemFileHandle;
}

const categories: (ChallengeCategory | "all")[] = [
  "all",
  "survivors",
  "skills",
  "skins",
  "items",
  "artifacts",
];

const dlcs: (DLC | "all")[] = ["all", "base", "sotv", "sots", "ac"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const GridContainer = ({ children, ...props }: any) => (
  <div
    {...props}
    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 pr-2 pb-4"
  >
    {children}
  </div>
);

const ItemContainer = ({ children, ...props }: any) => (
  <div {...props} className="h-full relative transition-all duration-300">
    {children}
  </div>
);

export function SaveEditor({
  initialSaveData,
  rawProfile,
  fileName,
  fileHandle,
}: SaveEditorProps) {
  const [saveData, setSaveData] = useState<SaveData>(initialSaveData);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ChallengeCategory | "all"
  >("all");
  const [selectedDLC, setSelectedDLC] = useState<DLC | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "unlocked" | "locked">("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"achievements" | "logbook">(
    "achievements",
  );

  // DLC Prompt Logic
  const [dlcOwnership, setDlcOwnership] = useState<Record<string, boolean>>({
    base: true,
  });
  const [isBulkPromptOpen, setIsBulkPromptOpen] = useState(false);

  // Debounce search to prevent animation lag
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const stats = calculateSaveStats(saveData);
  const logbookStats = calculateLogbookStats(saveData);

  // Filter challenges
  const filteredChallenges = challenges.filter((c) => {
    if (selectedCategory !== "all" && c.category !== selectedCategory)
      return false;
    if (selectedDLC !== "all" && c.dlc !== selectedDLC) return false;
    // Status filter
    const isUnlocked = saveData.achievements.includes(c.achievement);
    if (selectedStatus === "unlocked" && !isUnlocked) return false;
    if (selectedStatus === "locked" && isUnlocked) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.survivor?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unlockedInView = filteredChallenges.filter((c) =>
    saveData.achievements.includes(c.achievement),
  ).length;

  const handleCoinsChange = useCallback((coins: number) => {
    setSaveData((prev) => updateCoins(prev, coins));
    setHasChanges(true);
  }, []);

  const handleToggleAchievement = useCallback(
    (achievementId: string, enabled: boolean) => {
      setSaveData((prev) => toggleAchievement(prev, achievementId, enabled));
      setHasChanges(true);
    },
    [],
  );

  const performBulkUnlock = useCallback(
    (ownershipObj: Record<string, boolean>) => {
      setSaveData((prev) => unlockAll(prev, ownershipObj));
      setHasChanges(true);
    },
    [],
  );

  const handleUnlockAll = useCallback(() => {
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
  }, [dlcOwnership, performBulkUnlock]);

  const handleBulkConfirm = useCallback(
    (newOwnership: Record<string, boolean>) => {
      setDlcOwnership((prev) => ({ ...prev, ...newOwnership }));
      setIsBulkPromptOpen(false);
      performBulkUnlock({ ...dlcOwnership, ...newOwnership });
    },
    [dlcOwnership, performBulkUnlock],
  );

  const handleLockAll = useCallback(() => {
    setSaveData((prev) => lockAll(prev));
    setHasChanges(true);
  }, []);

  const handleExport = useCallback(async () => {
    const modifiedXml = generateModifiedXml(rawProfile, saveData);

    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(modifiedXml);
        await writable.close();
        alert("File saved successfully!");
        setHasChanges(false);
      } catch (err) {
        console.error("Failed to save file:", err);
        alert("Failed to save file to original location. Downloading instead.");
        downloadFile(modifiedXml, fileName, "text/xml");
      }
    } else {
      downloadFile(modifiedXml, fileName, "text/xml");
    }
  }, [rawProfile, saveData, fileName, fileHandle]);

  const handleLogbookChange = useCallback((newSaveData: SaveData) => {
    setSaveData(newSaveData);
    setHasChanges(true);
  }, []);

  const handleReset = () => {
    setSaveData({
      ...initialSaveData,
      achievements: [...initialSaveData.achievements],
      unviewedAchievements: [...initialSaveData.unviewedAchievements],
      viewedUnlockables: [...initialSaveData.viewedUnlockables],
      unlocks: [...initialSaveData.unlocks],
      stats: new Map(initialSaveData.stats),
      viewedViewables: [...initialSaveData.viewedViewables],
      discoveredPickups: [...initialSaveData.discoveredPickups],
    });
    setHasChanges(false);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-6 max-w-[1800px] mx-auto w-full">
      <BulkDLCPromptModal
        isOpen={isBulkPromptOpen}
        onConfirm={handleBulkConfirm}
        onCancel={() => setIsBulkPromptOpen(false)}
        existingOwnership={dlcOwnership}
      />

      {/* Left Sidebar - Two Card Layout */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 sticky top-6 max-h-[calc(100vh-6rem)]"
      >
        {/* CARD 1: Profile, Stats & Actions */}
        <div className="ror-card p-0 overflow-hidden flex flex-col">
          {/* Header / Profile */}
          <div className="p-4 border-b border-ror-border bg-ror-bg-header/50">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 bg-ror-bg-main border border-ror-border flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-ror-text-main/5" />
                <User size={24} className="text-ror-text-main relative z-10" />
              </div>
              <div className="overflow-hidden min-w-0">
                <input
                  type="text"
                  value={saveData.name}
                  onChange={(e) => {
                    setSaveData((prev) => ({ ...prev, name: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-transparent text-ror-text-main font-display text-lg truncate leading-none mb-1 focus:outline-none focus:ring-1 focus:ring-ror-orange-accent/50 rounded px-1 -ml-1 transition-all hover:bg-ror-bg-panel/50 placeholder:text-ror-text-dim/50"
                  placeholder="Profile Name"
                  title="Click to edit profile name"
                />
                <p
                  className="text-ror-text-dim text-[10px] truncate font-mono opacity-70"
                  title={fileName}
                >
                  {fileName}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="overflow-y-auto custom-scrollbar px-4 pt-4 pb-4">
            <div className="space-y-4">
              <StatBar
                label="ACHIEVEMENTS"
                value={stats.unlockedAchievements}
                max={stats.totalAchievements}
                color="var(--ror-blue-accent)"
              />
              <StatBar
                label="SURVIVORS"
                value={stats.unlockedSurvivors}
                max={13}
                color="var(--ror-orange-accent)"
              />
              <StatBar
                label="ITEMS"
                value={stats.unlockedItems}
                max={44}
                color="var(--ror-uncommon)"
              />
              <StatBar
                label="SKINS"
                value={stats.unlockedSkins}
                max={42}
                color="var(--ror-void)"
              />
              <StatBar
                label="LOGBOOK"
                value={logbookStats.unlockedEntries}
                max={logbookStats.totalEntries}
                color="var(--ror-equipment)"
              />
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="px-4 pt-2 pb-4 bg-ror-bg-header/30 border-t border-ror-border space-y-3">
            {/* Bulk Actions */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleUnlockAll}
                className="ror-button text-[10px] py-2 bg-ror-uncommon text-ror-bg-main border-ror-uncommon hover:brightness-110 font-bold tracking-wider"
              >
                UNLOCK ALL
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleLockAll}
                className="ror-button text-[10px] py-2 bg-ror-legendary text-ror-bg-main border-ror-legendary hover:brightness-110 font-bold tracking-wider"
              >
                LOCK ALL
              </motion.button>
            </div>

            <div className="h-[1px] bg-ror-border/50 w-full" />

            {/* File Actions */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleExport}
                disabled={!hasChanges}
                className="ror-button text-[10px] py-2 flex items-center justify-center gap-2"
              >
                <Download size={12} />
                {fileHandle ? "SAVE" : "EXPORT"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleReset}
                className="ror-button text-[10px] py-2 opacity-80 hover:opacity-100 flex items-center justify-center gap-2"
              >
                <RotateCcw size={12} />
                RESET
              </motion.button>
            </div>
          </div>
        </div>

        {/* CARD 2: Lunar Coins - Separate Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <CoinsEditor coins={saveData.coins} onChange={handleCoinsChange} />
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 relative">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex border-b border-ror-border"
        >
          <button
            type="button"
            onClick={() => setActiveTab("achievements")}
            className={`
              px-6 py-3 text-sm font-display uppercase tracking-wider transition-all flex items-center gap-2
              ${activeTab === "achievements"
                ? "text-ror-text-main border-b-2 border-ror-orange-accent"
                : "text-ror-text-dim hover:text-ror-text-main"
              }
            `}
          >
            <Trophy size={16} />
            Achievements
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logbook")}
            className={`
              px-6 py-3 text-sm font-display uppercase tracking-wider transition-all flex items-center gap-2
              ${activeTab === "logbook"
                ? "text-ror-text-main border-b-2 border-ror-orange-accent"
                : "text-ror-text-dim hover:text-ror-text-main"
              }
            `}
          >
            <Book size={16} />
            Logbook
          </button>
        </motion.div>

        {/* Tab Content */}
        {activeTab === "achievements" ? (
          <>
            {/* Stats Bar with Bulk Actions */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ror-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ror-bg-main border border-ror-border flex items-center justify-center">
                  <Trophy size={18} className="text-ror-text-main" />
                </div>
                <div>
                  <p className="text-ror-text-main font-display text-sm uppercase tracking-wider">
                    Achievement Progress
                  </p>
                  <p className="text-ror-text-muted text-xs">
                    <span className="text-ror-blue-accent">
                      {stats.unlockedAchievements}
                    </span>{" "}
                    / {stats.totalAchievements} achievements unlocked
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
              transition={{ duration: 0.5, delay: 0.3 }}
              className="ror-card p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center sticky top-0 z-20 bg-ror-bg-main/95 backdrop-blur-md border-b border-ror-border shadow-lg"
            >
              {/* Search */}
              <div className="relative w-full xl:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ror-text-muted"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full !pl-10 pr-8 py-2 text-sm ror-input bg-ror-bg-panel/50 focus:bg-ror-bg-panel"
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

              {/* Categories */}
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                  px-3 py-1 text-[10px] uppercase tracking-wider border transition-all
                  ${selectedCategory === cat
                        ? "bg-ror-text-muted text-ror-bg-main border-ror-text-muted font-bold"
                        : "bg-transparent text-ror-text-muted border-transparent hover:border-ror-text-dim hover:bg-ror-bg-panel"
                      }
                `}
                  >
                    {cat === "all" ? "ALL" : CATEGORY_NAMES[cat]}
                  </button>
                ))}
              </div>

              {/* DLCs */}
              <div className="flex flex-wrap gap-1 border-l border-ror-border pl-4">
                {dlcs.map((dlc) => (
                  <button
                    type="button"
                    key={dlc}
                    onClick={() => setSelectedDLC(dlc)}
                    className={`
                  px-2 py-1 text-[10px] uppercase tracking-wider border transition-all
                  ${selectedDLC === dlc
                        ? "bg-ror-orange-accent text-ror-bg-main border-ror-orange-accent font-bold"
                        : "bg-transparent text-ror-text-dim border-transparent hover:text-ror-text-main"
                      }
                `}
                  >
                    {dlc === "all"
                      ? "ALL"
                      : DLC_NAMES[dlc]
                        .replace("Survivors of the Void", "SOTV")
                        .replace("Seekers of the Storm", "SOTS")
                        .replace("Alloyed Collective", "AC")}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-1 border-l border-ror-border pl-4">
                {(["all", "unlocked", "locked"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`
                      px-2 py-1 text-[10px] uppercase tracking-wider border transition-all
                      ${selectedStatus === status
                        ? status === "unlocked"
                          ? "bg-ror-uncommon text-ror-bg-main border-ror-uncommon font-bold"
                          : status === "locked"
                            ? "bg-ror-legendary text-ror-bg-main border-ror-legendary font-bold"
                            : "bg-ror-text-muted text-ror-bg-main border-ror-text-muted font-bold"
                        : "bg-transparent text-ror-text-dim border-transparent hover:text-ror-text-main"
                      }
                    `}
                  >
                    {status === "all" ? "ALL" : status === "unlocked" ? "✓ UNLOCKED" : "✗ LOCKED"}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Results Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between px-2"
            >
              <span className="text-ror-text-dim text-xs tracking-wider uppercase">
                Showing {filteredChallenges.length} Entries
              </span>
              <span className="text-ror-text-dim text-xs tracking-wider uppercase">
                <span className="text-ror-uncommon">{unlockedInView}</span> Unlocked
                {" · "}
                <span className="text-ror-legendary">{filteredChallenges.length - unlockedInView}</span> Locked
              </span>
            </motion.div>

            {/* Grid */}
            {filteredChallenges.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center text-ror-text-dim"
              >
                NO DATA FOUND
              </motion.div>
            ) : (
              <div style={{ height: "calc(100vh - 200px)", width: "100%" }}>
                <VirtuosoGrid
                  style={{ height: "100%" }}
                  totalCount={filteredChallenges.length}
                  overscan={200}
                  components={{
                    List: GridContainer,
                    Item: ItemContainer,
                  }}
                  itemContent={(index) => {
                    const challenge = filteredChallenges[index];
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <ChallengeCard
                          challenge={challenge}
                          isUnlocked={saveData.achievements.includes(
                            challenge.achievement,
                          )}
                          onToggle={handleToggleAchievement}
                          linkedLogbookCount={getLogbookCountForChallenge(
                            challenge.id,
                          )}
                        />
                      </motion.div>
                    );
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <LogbookEditor
            saveData={saveData}
            onSaveDataChange={handleLogbookChange}
          />
        )}
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1 uppercase tracking-wider">
        <span className="text-ror-text-muted">{label}</span>
        <span className="text-ror-text-main">
          {value} <span className="text-ror-text-dim">/ {max}</span>
        </span>
      </div>
      <div className="h-2 bg-ror-bg-main border border-ror-border p-[1px]">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
