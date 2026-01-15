"use client";

import { motion } from "framer-motion";
import { Book, Check, Lock, Trophy } from "lucide-react";
import Image from "next/image";
import type { LogbookEntry } from "@/data/types";

interface LogbookCardProps {
  entry: LogbookEntry;
  isUnlocked: boolean;
  onToggle: (entry: LogbookEntry, enabled: boolean) => void;
  linkedChallengeCount?: number;
}

export function LogbookCard({
  entry,
  isUnlocked,
  onToggle,
  linkedChallengeCount = 0,
}: LogbookCardProps) {
  const handleToggle = () => {
    onToggle(entry, !isUnlocked);
  };

  const imageUrl = entry.image;
  const categoryColor = getCategoryColor(entry.category);
  const rarityColorClass = entry.rarity
    ? getRarityColorClass(entry.rarity)
    : categoryColor;
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

      {/* Category/Rarity Stripe */}
      <div className={`h-1 w-full ${rarityColorClass}`} />

      {/* Challenge Connection Badge */}
      {linkedChallengeCount > 0 && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 bg-ror-blue-accent/20 border border-ror-blue-accent/50 text-ror-blue-accent text-[8px] uppercase tracking-wider z-20"
          title={`Linked to ${linkedChallengeCount} ${linkedChallengeCount === 1 ? "challenge" : "challenges"}`}
        >
          <Trophy size={10} />
          {linkedChallengeCount}
        </div>
      )}

      <div className="p-3 flex gap-3 flex-1 relative z-10">
        {/* Icon Container */}
        <div
          className={`
          relative w-12 h-12 flex-shrink-0 bg-black border border-ror-border
          flex items-center justify-center overflow-hidden
          ${!isUnlocked && "opacity-50"}
        `}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={entry.name}
              width={48}
              height={48}
              className="object-contain w-full h-full"
              unoptimized
            />
          ) : (
            <Book
              size={20}
              className={
                isUnlocked ? "text-ror-text-main" : "text-ror-text-dim"
              }
            />
          )}
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Lock size={12} className="text-ror-text-muted" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start gap-2">
            <h4
              className={`
              font-display text-xs uppercase tracking-wide leading-tight
              ${isUnlocked ? "text-ror-text-main" : "text-ror-text-dim"}
            `}
            >
              {entry.name}
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

          {entry.description && (
            <p className="text-ror-text-muted text-[10px] leading-relaxed line-clamp-2 mb-1">
              {entry.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-1">
            {/* Category Tag */}
            <span
              className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider border ${getCategoryStyle(entry.category)}`}
            >
              {getCategoryLabel(entry.category)}
            </span>
            {/* DLC Tag */}
            {entry.dlc !== "base" && (
              <span
                className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider border ${getDLCStyle(entry.dlc)}`}
              >
                {getDLCShortName(entry.dlc)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "monsters":
      return "bg-ror-legendary";
    case "environments":
      return "bg-ror-uncommon";
    case "survivors":
      return "bg-ror-boss";
    case "items":
      return "bg-ror-common";
    case "equipment":
      return "bg-ror-equipment";
    case "drones":
      return "bg-ror-blue-accent";
    default:
      return "bg-ror-border";
  }
}

function getRarityColorClass(rarity: string): string {
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

function getCategoryStyle(category: string): string {
  switch (category) {
    case "monsters":
      return "border-ror-legendary/50 text-ror-legendary bg-ror-legendary/10";
    case "environments":
      return "border-ror-uncommon/50 text-ror-uncommon bg-ror-uncommon/10";
    case "survivors":
      return "border-ror-boss/50 text-ror-boss bg-ror-boss/10";
    case "items":
      return "border-ror-border text-ror-text-dim bg-ror-bg-main";
    case "equipment":
      return "border-ror-equipment/50 text-ror-equipment bg-ror-equipment/10";
    case "drones":
      return "border-ror-blue-accent/50 text-ror-blue-accent bg-ror-blue-accent/10";
    default:
      return "border-ror-border text-ror-text-dim bg-ror-bg-main";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "monsters":
      return "Monster";
    case "environments":
      return "Stage";
    case "survivors":
      return "Survivor";
    case "items":
      return "Item";
    case "equipment":
      return "Equip";
    case "drones":
      return "Drone";
    default:
      return category;
  }
}

function getDLCStyle(dlc: string): string {
  switch (dlc) {
    case "sotv":
      return "border-ror-void text-ror-void bg-ror-void/10";
    case "sots":
      return "border-ror-boss text-ror-boss bg-ror-boss/10";
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
