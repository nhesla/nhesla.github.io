/**
 * Assigns a visually distinct color to each unique label string.
 * The first 16 labels draw from a hand-picked palette spread across the
 * color wheel. Beyond that, FNV-1a hashing fills in additional colors.
 * Assignments are stable within a session (map never resets).
 */

const PALETTE = [
  "#e05c5c", // red
  "#4d9de0", // sky blue
  "#e8a838", // amber
  "#6bcb77", // green
  "#c77dff", // violet
  "#f08080", // salmon
  "#38c9c9", // teal
  "#ff9f43", // orange
  "#a29bfe", // lavender
  "#fd79a8", // pink
  "#00b894", // mint
  "#e17055", // coral
  "#74b9ff", // light blue
  "#55efc4", // seafoam
  "#ffeaa7", // pale yellow
  "#b2bec3", // silver
];

const labelColorMap = new Map<string, string>();

function fnvHash(label: string): string {
  let hash = 2166136261;
  for (let i = 0; i < label.length; i++) {
    hash ^= label.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  const raw = hash % 360;
  const hue = raw < 55 ? raw : raw < 80 ? raw + 80 : raw;
  return `hsl(${hue % 360}, 75%, 62%)`;
}

export function labelToColor(label: string): string {
  if (labelColorMap.has(label)) return labelColorMap.get(label)!;
  const color = labelColorMap.size < PALETTE.length
    ? PALETTE[labelColorMap.size]
    : fnvHash(label);
  console.log(`[labelToColor] slot ${labelColorMap.size}: "${label}" → ${color}`);
  labelColorMap.set(label, color);
  return color;
}

/** Call this when a new deck is imported so labels get fresh palette assignments. */
export function resetLabelColors(): void {
  labelColorMap.clear();
}