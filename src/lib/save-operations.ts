import { challenges } from "@/data/challenges";
import { logbookEntries } from "@/data/logbook-entries";
import type { LogbookEntry, RawUserProfile, SaveData } from "@/data/types";
import {
  applySaveData,
  extractSaveData,
  parseXml,
  serializeXml,
} from "./xml-parser";
import {
  getLogbookEntriesForChallenge,
  getChallengesForLogbookEntry,
  isLogbookEntryProvidedByOtherChallenge,
  shouldDisableChallengeForEntry,
} from "./challenge-logbook-mapping";

/**
 * Load and parse a save file from XML string
 */
export function loadSaveFile(xmlString: string): {
  raw: RawUserProfile;
  saveData: SaveData;
} {
  const raw = parseXml(xmlString);
  const saveData = extractSaveData(raw);
  return { raw, saveData };
}

/**
 * Update lunar coins in save data
 */
export function updateCoins(saveData: SaveData, coins: number): SaveData {
  return {
    ...saveData,
    coins: Math.max(0, coins),
  };
}

/**
 * Check if an achievement is unlocked
 */
export function isAchievementUnlocked(
  saveData: SaveData,
  achievementId: string,
): boolean {
  return saveData.achievements.includes(achievementId);
}

/**
 * Toggle an achievement (unlock or lock)
 * Also syncs related logbook entries (items/equipment)
 */
export function toggleAchievement(
  saveData: SaveData,
  achievementId: string,
  enabled: boolean,
): SaveData {
  const achievements = new Set(saveData.achievements);
  const unviewedAchievements = new Set(saveData.unviewedAchievements);
  const viewedUnlockables = new Set(saveData.viewedUnlockables);
  const unlocks = new Set(saveData.unlocks);
  const viewedViewables = new Set(saveData.viewedViewables);
  const discoveredPickups = new Set(saveData.discoveredPickups);

  // Find the challenge data to get unlocks
  const challenge = challenges.find((c) => c.achievement === achievementId);

  if (enabled) {
    // Add achievement
    achievements.add(achievementId);
    // Add to unviewed (game will show notification)
    unviewedAchievements.add(achievementId);
    // Add unlocks to viewed unlockables and actual unlocks
    if (challenge) {
      for (const unlock of challenge.unlocks) {
        viewedUnlockables.add(unlock);
        unlocks.add(unlock);
      }

      // Sync related logbook entries (items/equipment)
      const relatedEntries = getLogbookEntriesForChallenge(challenge.id);
      for (const entry of relatedEntries) {
        viewedViewables.add(entry.unlockId);
        unlocks.add(entry.unlockId);
        if (entry.pickupId) {
          discoveredPickups.add(entry.pickupId);
        }
      }
    }
  } else {
    // Remove achievement
    achievements.delete(achievementId);
    unviewedAchievements.delete(achievementId);
    // Remove from viewed unlockables and actual unlocks
    if (challenge) {
      for (const unlock of challenge.unlocks) {
        viewedUnlockables.delete(unlock);
        unlocks.delete(unlock);
      }

      // Sync related logbook entries (only if no other challenge provides them)
      const relatedEntries = getLogbookEntriesForChallenge(challenge.id);
      for (const entry of relatedEntries) {
        if (
          !isLogbookEntryProvidedByOtherChallenge(
            entry,
            achievementId,
            achievements,
          )
        ) {
          viewedViewables.delete(entry.unlockId);
          unlocks.delete(entry.unlockId);
          if (entry.pickupId) {
            discoveredPickups.delete(entry.pickupId);
          }
        }
      }
    }
  }

  return {
    ...saveData,
    achievements: Array.from(achievements),
    unviewedAchievements: Array.from(unviewedAchievements),
    viewedUnlockables: Array.from(viewedUnlockables),
    unlocks: Array.from(unlocks),
    viewedViewables: Array.from(viewedViewables),
    discoveredPickups: Array.from(discoveredPickups),
  };
}

/**
 * Unlock all achievements
 * Also syncs all related logbook entries
 */
export function unlockAll(saveData: SaveData): SaveData {
  const achievements = new Set(saveData.achievements);
  const viewedUnlockables = new Set(saveData.viewedUnlockables);
  const unlocks = new Set(saveData.unlocks);
  const viewedViewables = new Set(saveData.viewedViewables);
  const discoveredPickups = new Set(saveData.discoveredPickups);

  // Add all achievements and their unlocks
  for (const challenge of challenges) {
    achievements.add(challenge.achievement);
    for (const unlock of challenge.unlocks) {
      viewedUnlockables.add(unlock);
      unlocks.add(unlock);
    }

    // Sync related logbook entries
    const relatedEntries = getLogbookEntriesForChallenge(challenge.id);
    for (const entry of relatedEntries) {
      viewedViewables.add(entry.unlockId);
      unlocks.add(entry.unlockId);
      if (entry.pickupId) {
        discoveredPickups.add(entry.pickupId);
      }
    }
  }

  return {
    ...saveData,
    achievements: Array.from(achievements),
    unviewedAchievements: [], // Clear unviewed since we're bulk unlocking
    viewedUnlockables: Array.from(viewedUnlockables),
    unlocks: Array.from(unlocks),
    viewedViewables: Array.from(viewedViewables),
    discoveredPickups: Array.from(discoveredPickups),
  };
}

/**
 * Lock all achievements (reset to default)
 * Also clears related logbook entries (items/equipment from challenges)
 */
export function lockAll(saveData: SaveData): SaveData {
  // Get all logbook entries that are linked to challenges
  const challengeLinkedLogbookUnlockIds = new Set<string>();
  const challengeLinkedPickupIds = new Set<string>();

  for (const challenge of challenges) {
    const relatedEntries = getLogbookEntriesForChallenge(challenge.id);
    for (const entry of relatedEntries) {
      challengeLinkedLogbookUnlockIds.add(entry.unlockId);
      if (entry.pickupId) {
        challengeLinkedPickupIds.add(entry.pickupId);
      }
    }
  }

  // Remove challenge-linked logbook entries from viewedViewables and discoveredPickups
  const viewedViewables = saveData.viewedViewables.filter(
    (id) => !challengeLinkedLogbookUnlockIds.has(id),
  );
  const discoveredPickups = saveData.discoveredPickups.filter(
    (id) => !challengeLinkedPickupIds.has(id),
  );

  return {
    ...saveData,
    achievements: [],
    unviewedAchievements: [],
    viewedUnlockables: [],
    unlocks: [],
    viewedViewables,
    discoveredPickups,
  };
}

/**
 * Get count of unlocked achievements
 */
export function getUnlockedCount(saveData: SaveData): number {
  return saveData.achievements.length;
}

/**
 * Get count of total achievements
 */
export function getTotalCount(): number {
  return challenges.length;
}

/**
 * Generate the modified XML string for download
 */
export function generateModifiedXml(
  originalRaw: RawUserProfile,
  saveData: SaveData,
): string {
  const updatedRaw = applySaveData(originalRaw, saveData);
  return serializeXml(updatedRaw);
}

/**
 * Calculate stats about the current save
 */
export function calculateSaveStats(saveData: SaveData): {
  totalAchievements: number;
  unlockedAchievements: number;
  unlockedSurvivors: number;
  unlockedSkills: number;
  unlockedSkins: number;
  unlockedItems: number;
  unlockedArtifacts: number;
} {
  const unlockedSet = new Set(saveData.achievements);

  let survivors = 0;
  let skills = 0;
  let skins = 0;
  let items = 0;
  let artifacts = 0;

  for (const challenge of challenges) {
    if (unlockedSet.has(challenge.achievement)) {
      switch (challenge.category) {
        case "survivors":
          survivors++;
          break;
        case "skills":
          skills++;
          break;
        case "skins":
          skins++;
          break;
        case "items":
          items++;
          break;
        case "artifacts":
          artifacts++;
          break;
      }
    }
  }

  return {
    totalAchievements: challenges.length,
    unlockedAchievements: saveData.achievements.length,
    unlockedSurvivors: survivors,
    unlockedSkills: skills,
    unlockedSkins: skins,
    unlockedItems: items,
    unlockedArtifacts: artifacts,
  };
}

// ============================================
// LOGBOOK OPERATIONS
// ============================================

/**
 * Check if a logbook entry is unlocked
 */
export function isLogbookEntryUnlocked(
  saveData: SaveData,
  entry: LogbookEntry,
): boolean {
  // Check in stats.unlock for monster/environment/survivor logs
  if (saveData.unlocks.includes(entry.unlockId)) {
    return true;
  }

  // Check viewedViewables for viewed entries
  if (saveData.viewedViewables.includes(entry.unlockId)) {
    return true;
  }

  // Check discoveredPickups for items/equipment
  if (entry.pickupId && saveData.discoveredPickups.includes(entry.pickupId)) {
    return true;
  }

  return false;
}

/**
 * Toggle a logbook entry (unlock or lock)
 * Also syncs related challenges (for items/equipment)
 */
export function toggleLogbookEntry(
  saveData: SaveData,
  entry: LogbookEntry,
  enabled: boolean,
): SaveData {
  const unlocks = new Set(saveData.unlocks);
  const viewedViewables = new Set(saveData.viewedViewables);
  const discoveredPickups = new Set(saveData.discoveredPickups);
  const achievements = new Set(saveData.achievements);
  const unviewedAchievements = new Set(saveData.unviewedAchievements);
  const viewedUnlockables = new Set(saveData.viewedUnlockables);

  if (enabled) {
    // Add to unlocks (for logs)
    unlocks.add(entry.unlockId);
    // Add to viewedViewables (marks as viewed)
    viewedViewables.add(entry.unlockId);
    // Add to discoveredPickups if item/equipment
    if (entry.pickupId) {
      discoveredPickups.add(entry.pickupId);
    }

    // Sync related challenges (for items/equipment entries)
    const relatedChallenges = getChallengesForLogbookEntry(entry.id);
    for (const challenge of relatedChallenges) {
      achievements.add(challenge.achievement);
      unviewedAchievements.add(challenge.achievement);
      for (const unlock of challenge.unlocks) {
        viewedUnlockables.add(unlock);
        unlocks.add(unlock);
      }
      // Also unlock other logbook entries from this challenge
      const otherEntries = getLogbookEntriesForChallenge(challenge.id);
      for (const otherEntry of otherEntries) {
        viewedViewables.add(otherEntry.unlockId);
        unlocks.add(otherEntry.unlockId);
        if (otherEntry.pickupId) {
          discoveredPickups.add(otherEntry.pickupId);
        }
      }
    }
  } else {
    // Remove from all
    unlocks.delete(entry.unlockId);
    viewedViewables.delete(entry.unlockId);
    if (entry.pickupId) {
      discoveredPickups.delete(entry.pickupId);
    }

    // Sync related challenges (disable if appropriate)
    const relatedChallenges = getChallengesForLogbookEntry(entry.id);
    for (const challenge of relatedChallenges) {
      if (shouldDisableChallengeForEntry(challenge, entry, viewedViewables)) {
        achievements.delete(challenge.achievement);
        unviewedAchievements.delete(challenge.achievement);
        for (const unlock of challenge.unlocks) {
          viewedUnlockables.delete(unlock);
          unlocks.delete(unlock);
        }
        // Also remove other logbook entries from this challenge
        const otherEntries = getLogbookEntriesForChallenge(challenge.id);
        for (const otherEntry of otherEntries) {
          viewedViewables.delete(otherEntry.unlockId);
          unlocks.delete(otherEntry.unlockId);
          if (otherEntry.pickupId) {
            discoveredPickups.delete(otherEntry.pickupId);
          }
        }
      }
    }
  }

  return {
    ...saveData,
    achievements: Array.from(achievements),
    unviewedAchievements: Array.from(unviewedAchievements),
    viewedUnlockables: Array.from(viewedUnlockables),
    unlocks: Array.from(unlocks),
    viewedViewables: Array.from(viewedViewables),
    discoveredPickups: Array.from(discoveredPickups),
  };
}

/**
 * Unlock all logbook entries
 * Also syncs all related challenges (for items/equipment)
 */
export function unlockAllLogbook(saveData: SaveData): SaveData {
  const unlocks = new Set(saveData.unlocks);
  const viewedViewables = new Set(saveData.viewedViewables);
  const discoveredPickups = new Set(saveData.discoveredPickups);
  const achievements = new Set(saveData.achievements);
  const viewedUnlockables = new Set(saveData.viewedUnlockables);

  for (const entry of logbookEntries) {
    unlocks.add(entry.unlockId);
    viewedViewables.add(entry.unlockId);
    if (entry.pickupId) {
      discoveredPickups.add(entry.pickupId);
    }

    // Sync related challenges (for items/equipment)
    const relatedChallenges = getChallengesForLogbookEntry(entry.id);
    for (const challenge of relatedChallenges) {
      achievements.add(challenge.achievement);
      for (const unlock of challenge.unlocks) {
        viewedUnlockables.add(unlock);
        unlocks.add(unlock);
      }
    }
  }

  return {
    ...saveData,
    achievements: Array.from(achievements),
    unviewedAchievements: [], // Clear unviewed since we're bulk unlocking
    viewedUnlockables: Array.from(viewedUnlockables),
    unlocks: Array.from(unlocks),
    viewedViewables: Array.from(viewedViewables),
    discoveredPickups: Array.from(discoveredPickups),
  };
}

/**
 * Lock all logbook entries
 * Also locks challenges that only unlock items/equipment (no other unlocks)
 */
export function lockAllLogbook(saveData: SaveData): SaveData {
  const currentUnlocks = new Set(saveData.unlocks);
  const currentViewedViewables = new Set(saveData.viewedViewables);
  const currentDiscoveredPickups = new Set(saveData.discoveredPickups);
  const achievements = new Set(saveData.achievements);
  const unviewedAchievements = new Set(saveData.unviewedAchievements);
  const viewedUnlockables = new Set(saveData.viewedUnlockables);

  // Track challenges that should be disabled
  const challengesToDisable = new Set<string>();

  // Remove only logbook-related entries, preserve others
  for (const entry of logbookEntries) {
    currentUnlocks.delete(entry.unlockId);
    currentViewedViewables.delete(entry.unlockId);
    if (entry.pickupId) {
      currentDiscoveredPickups.delete(entry.pickupId);
    }

    // Find challenges to disable
    const relatedChallenges = getChallengesForLogbookEntry(entry.id);
    for (const challenge of relatedChallenges) {
      challengesToDisable.add(challenge.achievement);
    }
  }

  // Disable the related challenges
  for (const achievementId of challengesToDisable) {
    achievements.delete(achievementId);
    unviewedAchievements.delete(achievementId);
    const challenge = challenges.find((c) => c.achievement === achievementId);
    if (challenge) {
      for (const unlock of challenge.unlocks) {
        viewedUnlockables.delete(unlock);
        currentUnlocks.delete(unlock);
      }
    }
  }

  return {
    ...saveData,
    achievements: Array.from(achievements),
    unviewedAchievements: Array.from(unviewedAchievements),
    viewedUnlockables: Array.from(viewedUnlockables),
    unlocks: Array.from(currentUnlocks),
    viewedViewables: Array.from(currentViewedViewables),
    discoveredPickups: Array.from(currentDiscoveredPickups),
  };
}

/**
 * Calculate logbook statistics
 */
export function calculateLogbookStats(saveData: SaveData): {
  totalEntries: number;
  unlockedEntries: number;
  monsters: { total: number; unlocked: number };
  environments: { total: number; unlocked: number };
  survivors: { total: number; unlocked: number };
  items: { total: number; unlocked: number };
  equipment: { total: number; unlocked: number };
  drones: { total: number; unlocked: number };
} {
  const stats = {
    totalEntries: logbookEntries.length,
    unlockedEntries: 0,
    monsters: { total: 0, unlocked: 0 },
    environments: { total: 0, unlocked: 0 },
    survivors: { total: 0, unlocked: 0 },
    items: { total: 0, unlocked: 0 },
    equipment: { total: 0, unlocked: 0 },
    drones: { total: 0, unlocked: 0 },
  };

  for (const entry of logbookEntries) {
    stats[entry.category].total++;
    if (isLogbookEntryUnlocked(saveData, entry)) {
      stats[entry.category].unlocked++;
      stats.unlockedEntries++;
    }
  }

  return stats;
}
