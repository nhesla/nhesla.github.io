// ── CanvasEllipse ─────────────────────────────────────────────────────────────
// Data type and helpers for venn-diagram-style region ellipses on the canvas.

export interface CanvasEllipse {
  id:       string;
  label:    string;
  color:    string;
  cx:       number;   // center x
  cy:       number;   // center y
  rx:       number;   // x radius
  ry:       number;   // y radius
  rotation: number;   // degrees
}

// ── Factory ───────────────────────────────────────────────────────────────────

let _counter = 0;

export function createEllipse(cx: number, cy: number): CanvasEllipse {
  return {
    id:       "ellipse-" + Date.now() + "-" + (_counter++),
    label:    "Region",
    color:    "#88aaff",
    cx, cy,
    rx:       120,
    ry:       80,
    rotation: 0,
  };
}

// ── Point-in-ellipse hit test ─────────────────────────────────────────────────
// Returns true if (px, py) is inside the ellipse (accounts for rotation).

export function pointInEllipse(
  px: number, py: number,
  e: CanvasEllipse,
): boolean {
  const rad = (e.rotation * Math.PI) / 180;
  const cos = Math.cos(-rad);
  const sin = Math.sin(-rad);
  const dx = px - e.cx;
  const dy = py - e.cy;
  const lx = cos * dx - sin * dy;
  const ly = sin * dx + cos * dy;
  return (lx * lx) / (e.rx * e.rx) + (ly * ly) / (e.ry * e.ry) <= 1;
}

// ── Member card detection ─────────────────────────────────────────────────────
// Returns cardnames whose center point falls inside the ellipse.

import { Card } from "../data/CardImporter";
import { Position } from "./ForceLayout";
import { cardSize } from "./canvasUtils";

export function getEllipseMembers(
  ellipse: CanvasEllipse,
  cards: Card[],
  positionMap: Record<string, Position>,
): string[] {
  return cards
    .filter(card => {
      const pos = positionMap[card.cardname] ?? { x: card.x, y: card.y };
      const cx = pos.x + cardSize.width  / 2;
      const cy = pos.y + cardSize.height / 2;
      return pointInEllipse(cx, cy, ellipse);
    })
    .map(c => c.cardname);
}