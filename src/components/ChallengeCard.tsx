"use client";

import { motion } from "framer-motion";
import { Book, Check, Lock } from "lucide-react";
import Image from "next/image";
import type { Challenge } from "@/data/types";

const DEFAULT_ACHIEVEMENT_IMAGE =
  "https://cdn.fastly.steamstatic.com/steamcommunity/public/images/apps/632360/3ebb5f75a716aa6fcab12b7354c3b87e971bcfd5.jpg";

interface ChallengeCardProps {
  challenge: Challenge;
  isUnlocked: boolean;
  onToggle: (achievementId: string, enabled: boolean) => void;
  linkedLogbookCount?: number;
}

export function ChallengeCard({
  challenge,
  isUnlocked,
  onToggle,
  linkedLogbookCount = 0,
}: ChallengeCardProps) {
  const handleToggle = () => {
    onToggle(challenge.achievement, !isUnlocked);
  };

  const imageUrl = challenge.image || DEFAULT_ACHIEVEMENT_IMAGE;

  const rarityColorClass = getRarityColorClass(challenge.rarity);
  const borderColorClass = isUnlocked
    ? "border-ror-border-highlight"
    : "border-ror-border";

  return (
    <motion.div
      onClick={handleToggle}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative cursor-pointer ror-card h-full flex flex-col
        group overflow-hidden
        ${isUnlocked ? "bg-ror-bg-panel" : "bg-ror-bg-main opacity-80 hover:opacity-100"}
        ${borderColorClass}
        hover:border-ror-text-muted
      `}
    >
      {/* Hover Highlight Overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Rarity Stripe */}
      <div className={`h-1 w-full ${rarityColorClass}`} />

      {/* Logbook Connection Badge */}
      {linkedLogbookCount > 0 && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 bg-ror-equipment/20 border border-ror-equipment/50 text-ror-equipment text-[8px] uppercase tracking-wider z-20"
          title={`Affects ${linkedLogbookCount} logbook ${linkedLogbookCount === 1 ? "entry" : "entries"}`}
        >
          <Book size={10} />
          {linkedLogbookCount}
        </div>
      )}

      <div className="p-3 flex gap-3 flex-1 relative z-10">
        {/* Image Container */}
        <div
          className={`
          relative w-16 h-16 flex-shrink-0 bg-black border border-ror-border
          ${!isUnlocked && "grayscale opacity-50"}
        `}
        >
          <Image
            src={imageUrl}
            alt={challenge.name}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Lock size={16} className="text-ror-text-muted" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start gap-2">
            <h4
              className={`
              font-display text-xs uppercase tracking-wide leading-tight mb-1
              ${isUnlocked ? "text-ror-text-main" : "text-ror-text-dim"}
            `}
            >
              {challenge.name}
            </h4>

            {/* Checkbox-like indicator */}
            <motion.div
              animate={{
                backgroundColor: isUnlocked
                  ? "var(--ror-uncommon)"
                  : "rgba(0, 0, 0, 0)",
                borderColor: isUnlocked
                  ? "var(--ror-uncommon)"
                  : "var(--ror-border)",
              }}
              className={`
                w-4 h-4 border flex items-center justify-center flex-shrink-0
                ${isUnlocked ? "text-ror-bg-main" : "text-transparent"}
              `}
            >
              <Check size={12} strokeWidth={4} />
            </motion.div>
          </div>

          <p className="text-ror-text-muted text-[10px] leading-relaxed line-clamp-3 mb-2">
            {challenge.description}
          </p>

          <div className="mt-auto flex flex-wrap gap-1">
            {/* Tags */}
            <span
              className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider border ${getCategoryStyle(challenge.category)}`}
            >
              {challenge.category}
            </span>
            {challenge.dlc !== "base" && (
              <span
                className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider border ${getDLCStyle(challenge.dlc)}`}
              >
                {getDLCShortName(challenge.dlc)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getRarityColorClass(rarity?: string): string {
  switch (rarity) {
    case "common":
      return "bg-ror-common";
    case "uncommon":
      return "bg-ror-uncommon";
    case "legendary":
      return "bg-ror-legendary";
    case "boss":
      return "bg-ror-boss";
    case "lunar":
      return "bg-ror-lunar";
    case "void":
      return "bg-ror-void";
    case "equipment":
      return "bg-ror-equipment";
    default:
      return "bg-ror-border";
  }
}

function getCategoryStyle(_category: string): string {
  // Using generic styles for categories to keep it clean, or specific colors if desired
  return "border-ror-border text-ror-text-dim bg-ror-bg-main";
}

function getDLCStyle(dlc: string): string {
  switch (dlc) {
    case "sotv":
      return "border-ror-void text-ror-void bg-ror-void/10";
    case "sots":
      return "border-ror-boss text-ror-boss bg-ror-boss/10"; // Using boss yellow/gold for SOTS
    case "ac":
      return "border-ror-lunar text-ror-lunar bg-ror-lunar/10";
    default:
      return "border-ror-border text-ror-text-dim";
  }
}

function getDLCShortName(dlc: string): string {
  const names: Record<string, string> = {
    sotv: "VOID",
    sots: "STORM",
    ac: "ALLOYED",
  };
  return names[dlc] || dlc.toUpperCase();
}
