
import { toggleLogbookEntry } from "./src/lib/save-operations";
import { logbookEntries } from "./src/data/logbook-entries";
import type { LogbookEntry, SaveData } from "./src/data/types";

// Mock SaveData
const mockSaveData: SaveData = {
    achievements: [],
    unviewedAchievements: [],
    viewedUnlockables: [],
    unlocks: [],
    viewedViewables: [],
    discoveredPickups: [],
    coins: 0,
    stats: new Map(),
    name: "TestUser"
};

// Find Commando Entry
const commandoEntry = logbookEntries.find(e => e.id === "commando");

if (!commandoEntry) {
    console.error("Could not find Commando entry!");
    process.exit(1);
}

console.log("Testing Commando Unlock...");
const updatedSave = toggleLogbookEntry(mockSaveData, commandoEntry, true);

console.log("Viewed Viewables:", updatedSave.viewedViewables);

const hasMainId = updatedSave.viewedViewables.includes(commandoEntry.unlockId);
const hasAlias = updatedSave.viewedViewables.includes("/Survivors/Commando");

console.log(`Has Main ID (${commandoEntry.unlockId}):`, hasMainId);
console.log("Has Alias (/Survivors/Commando):", hasAlias);

if (hasMainId && hasAlias) {
    console.log("SUCCESS: Both IDs are present.");
} else {
    console.error("FAILURE: Missing expected IDs.");
    process.exit(1);
}
