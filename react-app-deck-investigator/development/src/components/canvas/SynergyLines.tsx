import React from "react";
import { Card } from "../data/CardImporter";
import { SynergyConnection, SynergyDirection } from "../data/SynergyEngine";
import { labelToColor } from "./labelToColor";
import { ManualConnection } from "../data/ManualConnection";
import { Position } from "./ForceLayout";
import { cardSize, offsetLine, shortenLine, cardEdgePoint } from "./canvasUtils";

// ── Marker helpers ────────────────────────────────────────────────────────────

function synergyMarkerId(label: string, direction: "start" | "end") {
  return "arrow-syn-" + label.replace(/[^a-zA-Z0-9]/g, "_") + "-" + direction;
}

function manualMarkerId(id: string, direction: "start" | "end") {
  return "arrow-manual-" + id + "-" + direction;
}

function Defs({ synergyConnections, manualConnections }: { synergyConnections: SynergyConnection[], manualConnections: ManualConnection[] }) {
  // Build unique labels from synergy connections, tracking solid state and color
  const synergyLabelMap = new Map<string, { solid: boolean; color: string }>();
  for (const c of synergyConnections) {
    const resolved = c.color ?? labelToColor(c.label);
    if (!synergyLabelMap.has(c.label)) synergyLabelMap.set(c.label, { solid: !!c.solid, color: resolved });
    else if (c.solid) synergyLabelMap.get(c.label)!.solid = true;
  }
  return (
    <defs>
      {Array.from(synergyLabelMap.entries()).flatMap(([label, { solid, color }]) => {
        const id = label.replace(/[^a-zA-Z0-9]/g, "_");
        // Hollow arrowhead = outlined triangle; solid = filled triangle
        const arrowPath = solid
          ? "M0,0 L0,6 L6,3 z"
          : "M0,0 L0,6 L6,3 L0,0 z"; // same shape, fill controlled by fillOpacity
        return [
          <marker key={label + "-end"} id={"arrow-syn-" + id + "-end"}
            markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d={arrowPath} fill={solid ? color : "none"} stroke={color} strokeWidth={solid ? 0 : 0.8} opacity="0.9" />
          </marker>,
          <marker key={label + "-start"} id={"arrow-syn-" + id + "-start"}
            markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
            <path d={arrowPath} fill={solid ? color : "none"} stroke={color} strokeWidth={solid ? 0 : 0.8} opacity="0.9" />
          </marker>,
        ];
      })}
      {manualConnections.flatMap(conn => [
        <marker key={conn.id + "-end"} id={manualMarkerId(conn.id, "end")}
          markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={conn.color} opacity="0.9" />
        </marker>,
        <marker key={conn.id + "-start"} id={manualMarkerId(conn.id, "start")}
          markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L0,6 L6,3 z" fill={conn.color} opacity="0.9" />
        </marker>,
      ])}
    </defs>
  );
}

// ── Stripe builder (auto synergy lines — dashed) ──────────────────────────────

function buildStripes(
  pairKey: string,
  conns: SynergyConnection[],
  ex1: number, ey1: number,
  ex2: number, ey2: number,
  isHighlighted: boolean,
  isDimmed: boolean,
): React.ReactElement[] {
  const [nameA] = pairKey.split("|");
  const total = conns.length;
  const direction: SynergyDirection = conns[0].direction;
  const isFlipped = conns[0].from !== nameA;

  return conns.map((conn, i) => {
    const base = total > 1
      ? offsetLine(ex1, ey1, ex2, ey2, i, total)
      : { x1: ex1, y1: ey1, x2: ex2, y2: ey2 };
    const TRIM = direction === "none" ? 0 : 8;
    const { x1, y1, x2, y2 } = shortenLine(base.x1, base.y1, base.x2, base.y2, TRIM, TRIM);

    let markerStart: string | undefined;
    let markerEnd:   string | undefined;
    if (direction === "forward") {
      if (!isFlipped) markerEnd   = "url(#" + synergyMarkerId(conn.label, "end") + ")";
      else            markerStart = "url(#" + synergyMarkerId(conn.label, "start") + ")";
    } else if (direction === "bidirectional") {
      markerStart = "url(#" + synergyMarkerId(conn.label, "start") + ")";
      markerEnd   = "url(#" + synergyMarkerId(conn.label, "end") + ")";
    }

    return (
      <line key={"stripe-" + pairKey + "-" + i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={conn.color ?? labelToColor(conn.label)}
        strokeWidth={isHighlighted ? 3 : 1.5}
        strokeDasharray={conn.solid ? "none" : (direction === "none" ? "none" : "6 4")}
        opacity={isDimmed ? 0.1 : isHighlighted ? 1 : 0.6}
        markerEnd={markerEnd} markerStart={markerStart}
        style={{ pointerEvents: "none" }} />
    );
  });
}

// ── Label with background rect ────────────────────────────────────────────────

// ── Label overlap separation ──────────────────────────────────────────────────
// Estimates label bounding boxes and runs a repulsion pass to spread overlaps.

const LABEL_FONT   = 12;
const LABEL_PAD_X  = 6;
const LABEL_PAD_Y  = 3;

function labelSize(label: string): { w: number; h: number } {
  return {
    w: label.length * LABEL_FONT * 0.55 + LABEL_PAD_X * 2,
    h: LABEL_FONT + LABEL_PAD_Y * 2,
  };
}

function separateLabels(
  labels: { label: string; x: number; y: number; color: string }[],
  iterations = 30,
): { label: string; x: number; y: number; color: string }[] {
  // Work on a mutable copy
  const pos = labels.map(l => ({ ...l }));

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i], b = pos[j];
        const sa = labelSize(a.label), sb = labelSize(b.label);
        const minDx = (sa.w + sb.w) / 2 + 4;  // 4px gutter
        const minDy = (sa.h + sb.h) / 2 + 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          // Push along the axis with less overlap to minimise movement
          if (overlapX < overlapY) {
            const push = overlapX / 2 + 0.5;
            const dir  = dx >= 0 ? 1 : -1;
            a.x -= push * dir;
            b.x += push * dir;
          } else {
            const push = overlapY / 2 + 0.5;
            const dir  = dy >= 0 ? 1 : -1;
            a.y -= push * dir;
            b.y += push * dir;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return pos;
}

function renderLabelTag(
  key: string,
  label: string,
  x: number,
  y: number,
  color: string,
  highlighted: boolean,
): React.ReactElement {
  const fontSize  = 12;
  const padX      = 6;
  const padY      = 3;
  const approxW   = label.length * fontSize * 0.55 + padX * 2;
  const rectH     = fontSize + padY * 2;
  return (
    <g key={key} style={{ pointerEvents: "none" }}>
      <rect
        x={x - approxW / 2} y={y - rectH + padY}
        width={approxW} height={rectH}
        rx={3} ry={3}
        fill={color}
        fillOpacity={highlighted ? 0.35 : 0.18}
        stroke={color}
        strokeOpacity={highlighted ? 0.9 : 0.5}
        strokeWidth={1}
      />
      <text
        x={x} y={y}
        fill="white" fontSize={fontSize} textAnchor="middle"
        dominantBaseline="auto"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}



export type ActiveHighlight =
  | { mode: "card"; cardName: string }
  | { mode: "label"; label: string }
  | null;

interface SynergyLinesProps {
  cards: Card[];
  positionMap: Record<string, Position>;
  synergyConnections: SynergyConnection[];
  manualConnections: ManualConnection[];
  hiddenLabels: Set<string>;
  activeHighlight: ActiveHighlight;
  selectionRect: { x: number; y: number; w: number; h: number } | null;
  // ctrl-mode: when true, manual lines get a wide invisible hit area for clicking
  ctrlMode: boolean;
  selectedLineId: string | null;
  onLineClick: (conn: ManualConnection) => void;
  alwaysShowLabels: boolean;
  disabledCards: Set<string>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCardCenter(card: Card, positionMap: Record<string, Position>) {
  const pos = positionMap[card.cardname] ?? { x: card.x, y: card.y };
  return {
    x: pos.x + cardSize.width  / 2,
    y: pos.y + cardSize.height / 2,
  };
}

function buildPairMap(
  synergyConnections: SynergyConnection[],
  hiddenLabels: Set<string>,
): Map<string, SynergyConnection[]> {
  const pairMap = new Map<string, SynergyConnection[]>();
  for (const conn of synergyConnections) {
    if (hiddenLabels.has(conn.label)) continue;
    if (conn.highlightOnly) continue;
    const key = [conn.from, conn.to].sort().join("|");
    if (!pairMap.has(key)) pairMap.set(key, []);
    pairMap.get(key)!.push(conn);
  }
  return pairMap;
}

function isPairHighlighted(
  conns: SynergyConnection[],
  nameA: string,
  nameB: string,
  active: ActiveHighlight,
): boolean {
  if (!active) return false;
  if (active.mode === "card") return nameA === active.cardName || nameB === active.cardName;
  return conns.some(c => c.label === active.label);
}

function isManualHighlighted(conn: ManualConnection, active: ActiveHighlight): boolean {
  if (!active) return false;
  if (active.mode === "card") return conn.from === active.cardName || conn.to === active.cardName;
  return conn.label === active.label;
}

function isHighlightOnlyLabel(
  label: string,
  synergyConnections: SynergyConnection[],
  manualConnections: ManualConnection[],
): boolean {
  const allConns = [
    ...synergyConnections.filter(c => c.label === label),
    ...manualConnections.filter(c => c.label === label),
  ];
  return allConns.length > 0 && allConns.every(c => c.highlightOnly);
}

// ── Component ─────────────────────────────────────────────────────────────────

const SynergyLines: React.FC<SynergyLinesProps> = ({
  cards,
  positionMap,
  synergyConnections,
  manualConnections,
  hiddenLabels,
  activeHighlight,
  selectionRect,
  ctrlMode,
  selectedLineId,
  onLineClick,
  alwaysShowLabels,
  disabledCards,
}) => {
  const cardMap = new Map(cards.map(c => [c.cardname, c]));
  const pairMap = buildPairMap(synergyConnections, hiddenLabels);
  // Remove pairs involving disabled cards
  for (const key of Array.from(pairMap.keys())) {
    const [a, b] = key.split("|");
    if (disabledCards.has(a) || disabledCards.has(b)) pairMap.delete(key);
  }
  const visibleManual = manualConnections.filter(c =>
    !hiddenLabels.has(c.label) && !c.highlightOnly &&
    !disabledCards.has(c.from) && !disabledCards.has(c.to)
  );

  const isHighlightOnlyActive =
    activeHighlight?.mode === "label" &&
    isHighlightOnlyLabel(activeHighlight.label, synergyConnections, manualConnections);

  const shouldDim = activeHighlight !== null && !isHighlightOnlyActive;

  // ── Helper: resolve endpoints for a manual connection ─────────────────────

  const resolveEndpoints = (conn: ManualConnection) => {
    const cardA = cardMap.get(conn.from), cardB = cardMap.get(conn.to);
    if (!cardA || !cardB) return null;
    const cA = getCardCenter(cardA, positionMap);
    const cB = getCardCenter(cardB, positionMap);
    const eA = cardEdgePoint(cA, cB);
    const eB = cardEdgePoint(cB, cA);
    const TRIM = conn.direction === "none" ? 0 : 8;
    const pts = shortenLine(eA.x, eA.y, eB.x, eB.y, TRIM, TRIM);
    return pts;
  };

  // ── Helper: render a single manual line (solid) ───────────────────────────

  const renderManualLine = (conn: ManualConnection, highlighted: boolean) => {
    const pts = resolveEndpoints(conn);
    if (!pts) return null;
    const { x1, y1, x2, y2 } = pts;
    const isDimmed = !highlighted && shouldDim;
    const isSelected = conn.id === selectedLineId;

    let markerStart: string | undefined;
    let markerEnd:   string | undefined;
    if (conn.direction === "forward") {
      markerEnd = "url(#" + manualMarkerId(conn.id, "end") + ")";
    } else if (conn.direction === "bidirectional") {
      markerStart = "url(#" + manualMarkerId(conn.id, "start") + ")";
      markerEnd   = "url(#" + manualMarkerId(conn.id, "end") + ")";
    }

    return (
      <g key={"manual-grp-" + (highlighted ? "hl-" : "") + conn.id}>
        {/* Visible line */}
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isSelected ? "white" : conn.color}
          strokeWidth={highlighted || isSelected ? 3 : 1.5}
          opacity={isDimmed ? 0.1 : highlighted || isSelected ? 1 : 0.6}
          markerStart={markerStart} markerEnd={markerEnd}
          style={{ pointerEvents: "none" }} />
        {/* Wide invisible hit area — only active in ctrlMode */}
        {ctrlMode && (
          <line
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="transparent"
            strokeWidth={16}
            style={{ cursor: "pointer", pointerEvents: "stroke" }}
            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onLineClick(conn); }} />
        )}
      </g>
    );
  };

  // ── Normal synergy lines ──────────────────────────────────────────────────

  const normalLines: React.ReactElement[] = [];
  for (const [pairKey, conns] of pairMap.entries()) {
    const [nameA, nameB] = pairKey.split("|");
    const cardA = cardMap.get(nameA), cardB = cardMap.get(nameB);
    if (!cardA || !cardB) continue;
    if (isPairHighlighted(conns, nameA, nameB, activeHighlight)) continue;
    const cA = getCardCenter(cardA, positionMap);
    const cB = getCardCenter(cardB, positionMap);
    const eA = cardEdgePoint(cA, cB);
    const eB = cardEdgePoint(cB, cA);
    normalLines.push(
      <g key={"lines-" + pairKey}>
        {buildStripes(pairKey, conns, eA.x, eA.y, eB.x, eB.y, false, shouldDim)}
      </g>
    );
  }

  // ── Normal manual lines ───────────────────────────────────────────────────

  const manualLines = visibleManual
    .filter(conn => !isManualHighlighted(conn, activeHighlight))
    .map(conn => renderManualLine(conn, false))
    .filter(Boolean) as React.ReactElement[];

  // ── Selection rect ────────────────────────────────────────────────────────

  const selRect = selectionRect && (selectionRect.w > 2 || selectionRect.h > 2) ? (
    <rect
      x={selectionRect.x} y={selectionRect.y}
      width={selectionRect.w} height={selectionRect.h}
      fill="rgba(100,150,255,0.08)" stroke="#88aaff"
      strokeWidth="1" strokeDasharray="4 3"
      style={{ pointerEvents: "none" }} />
  ) : null;

  // ── Highlighted lines ─────────────────────────────────────────────────────

  const highlightedLines: React.ReactElement[] = [];
  const mids: Array<{ x: number; y: number }> = [];

  if (activeHighlight && !isHighlightOnlyActive) {
    for (const [pairKey, conns] of pairMap.entries()) {
      const [nameA, nameB] = pairKey.split("|");
      if (!isPairHighlighted(conns, nameA, nameB, activeHighlight)) continue;
      const cardA = cardMap.get(nameA), cardB = cardMap.get(nameB);
      if (!cardA || !cardB) continue;
      const cA = getCardCenter(cardA, positionMap);
      const cB = getCardCenter(cardB, positionMap);
      const eA = cardEdgePoint(cA, cB);
      const eB = cardEdgePoint(cB, cA);
      mids.push({ x: (cA.x + cB.x) / 2, y: (cA.y + cB.y) / 2 });
      highlightedLines.push(
        <g key={"hl-" + pairKey}>
          {buildStripes(pairKey, conns, eA.x, eA.y, eB.x, eB.y, true, false)}
        </g>
      );
    }

    for (const conn of visibleManual) {
      if (!isManualHighlighted(conn, activeHighlight)) continue;
      const cardA = cardMap.get(conn.from), cardB = cardMap.get(conn.to);
      if (!cardA || !cardB) continue;
      const cA = getCardCenter(cardA, positionMap);
      const cB = getCardCenter(cardB, positionMap);
      mids.push({ x: (cA.x + cB.x) / 2, y: (cA.y + cB.y) / 2 });
      const line = renderManualLine(conn, true);
      if (line) highlightedLines.push(line);
    }

    if (activeHighlight.mode === "label" && mids.length > 0) {
      const avgX = mids.reduce((s, p) => s + p.x, 0) / mids.length;
      const avgY = mids.reduce((s, p) => s + p.y, 0) / mids.length;
      const color = labelToColor(activeHighlight.label);
      highlightedLines.push(
        renderLabelTag("label-hover", activeHighlight.label, avgX, avgY - 8, color, true)
      );
    }
  }

  // ── Always-visible labels ──────────────────────────────────────────────────

  const alwaysLabels: React.ReactElement[] = [];
  if (alwaysShowLabels) {
    // Synergy labels — one label per unique label, at avg midpoint of all its pairs
    const labelMids = new Map<string, { xs: number[]; ys: number[]; color: string }>();
    for (const [pairKey, conns] of pairMap.entries()) {
      const [nameA, nameB] = pairKey.split("|");
      const cardA = cardMap.get(nameA), cardB = cardMap.get(nameB);
      if (!cardA || !cardB) continue;
      const cA = getCardCenter(cardA, positionMap);
      const cB = getCardCenter(cardB, positionMap);
      const mx = (cA.x + cB.x) / 2, my = (cA.y + cB.y) / 2;
      for (const conn of conns) {
        if (!labelMids.has(conn.label)) labelMids.set(conn.label, { xs: [], ys: [], color: conn.color ?? labelToColor(conn.label) });
        labelMids.get(conn.label)!.xs.push(mx);
        labelMids.get(conn.label)!.ys.push(my);
      }
    }
    // Manual labels
    for (const conn of visibleManual) {
      const cardA = cardMap.get(conn.from), cardB = cardMap.get(conn.to);
      if (!cardA || !cardB) continue;
      const cA = getCardCenter(cardA, positionMap);
      const cB = getCardCenter(cardB, positionMap);
      const mx = (cA.x + cB.x) / 2, my = (cA.y + cB.y) / 2;
      if (!labelMids.has(conn.label)) labelMids.set(conn.label, { xs: [], ys: [], color: conn.color });
      labelMids.get(conn.label)!.xs.push(mx);
      labelMids.get(conn.label)!.ys.push(my);
    }

    const rawLabelPositions: { label: string; x: number; y: number; color: string }[] = [];

    for (const [label, { xs, ys, color }] of labelMids.entries()) {
      const avgX = xs.reduce((s, v) => s + v, 0) / xs.length;
      const avgY = ys.reduce((s, v) => s + v, 0) / ys.length;
      const isHovered = activeHighlight?.mode === "label" && activeHighlight.label === label;
      if (!isHovered) rawLabelPositions.push({ label, x: avgX, y: avgY - 8, color });
    }

    const separatedPositions = separateLabels(rawLabelPositions);

    for (const { label, x, y, color } of separatedPositions) {
      alwaysLabels.push(
        renderLabelTag("always-" + label, label, x, y, color, false)
      );
    }
  }

  return (
    <>
      <svg style={{
        position: "absolute", top: 0, left: 0,
        zIndex: ctrlMode ? 3 : 1,
        width: "100%", height: "100%", overflow: "visible",
        pointerEvents: ctrlMode ? "all" : "none",
      }}>
        <Defs synergyConnections={synergyConnections} manualConnections={manualConnections} />
        {normalLines}
        {manualLines}
        {selRect}
      </svg>

      <svg style={{
        position: "absolute", top: 0, left: 0, zIndex: 4,
        width: "100%", height: "100%", overflow: "visible",
        pointerEvents: "none",
      }}>
        {highlightedLines}
        {alwaysLabels}
      </svg>
    </>
  );
};

export default SynergyLines;