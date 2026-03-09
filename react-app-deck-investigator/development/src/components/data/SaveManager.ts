import { ManualConnection } from "./ManualConnection";
import { Position } from "../canvas/ForceLayout";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeckSave {
  name: string;
  savedAt: number;
  game: string;
  decklistText: string;
  positions: Record<string, Position>;
  manualConnections: ManualConnection[];
  disabledCards?: string[];
  printingOverrides?: Record<string, string>;
  ellipses?: any[];
  synergyConnections?: any[];
}

const STORAGE_KEY = "deck-investigator:saves";

// ── localStorage helpers ──────────────────────────────────────────────────────

export function loadAllSaves(): DeckSave[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DeckSave[];
  } catch {
    return [];
  }
}

export function persistAllSaves(saves: DeckSave[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  } catch (e) {
    console.error("[SaveManager] Failed to write localStorage:", e);
  }
}

export function saveSlot(save: DeckSave): DeckSave[] {
  const saves = loadAllSaves();
  const idx = saves.findIndex(s => s.name === save.name);
  if (idx >= 0) {
    saves[idx] = save;
  } else {
    saves.push(save);
  }
  persistAllSaves(saves);
  return saves;
}

export function deleteSlot(name: string): DeckSave[] {
  const saves = loadAllSaves().filter(s => s.name !== name);
  persistAllSaves(saves);
  return saves;
}

export function slotExists(name: string): boolean {
  return loadAllSaves().some(s => s.name === name);
}

// ── JSON export ───────────────────────────────────────────────────────────────

export function exportSavesToJson(saves: DeckSave[]): void {
  const json = JSON.stringify(saves, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "deck-investigator-saves.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSingleSave(save: DeckSave): void {
  const json = JSON.stringify([save], null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = save.name.replace(/[^a-z0-9]/gi, "_") + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

// ── JSON import ───────────────────────────────────────────────────────────────

export type ImportResult =
  | { ok: true;  imported: DeckSave[]; skipped: string[]; merged: DeckSave[] }
  | { ok: false; error: string };

// Reads a JSON file and merges into existing saves.
// On name collision, the imported slot wins (overwrites).
export function importSavesFromJson(file: File): Promise<ImportResult> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) {
          resolve({ ok: false, error: "Invalid file format — expected a JSON array." });
          return;
        }
        const incoming = parsed as DeckSave[];
        const existing = loadAllSaves();
        const skipped: string[] = [];
        const merged  = [...existing];

        for (const incoming_save of incoming) {
          if (!incoming_save.name || !incoming_save.decklistText) {
            skipped.push(incoming_save.name ?? "(unnamed)");
            continue;
          }
          const idx = merged.findIndex(s => s.name === incoming_save.name);
          if (idx >= 0) {
            merged[idx] = incoming_save;
          } else {
            merged.push(incoming_save);
          }
        }

        persistAllSaves(merged);
        resolve({ ok: true, imported: incoming, skipped, merged });
      } catch {
        resolve({ ok: false, error: "Could not parse file — make sure it's a valid JSON export." });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: "Failed to read file." });
    reader.readAsText(file);
  });
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatTimestamp(savedAt: number): string {
  const d = new Date(savedAt);
  return d.toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  }) + " " + d.toLocaleTimeString(undefined, {
    hour: "numeric", minute: "2-digit",
  });
}
