import React, { useRef } from "react";
import { CanvasEllipse, pointInEllipse } from "./CanvasEllipse";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EllipseLayerProps {
  ellipses:          CanvasEllipse[];
  ctrlMode:          boolean;
  selectedId:        string | null;
  hoveredLegendId:   string | null;       // ellipse id hovered in legend
  onSelect:          (id: string | null) => void;
  onChange:          (ellipse: CanvasEllipse) => void;
  onRightClick:      (ellipse: CanvasEllipse, e: React.MouseEvent) => void;
  width:             number;
  height:            number;
}

type HandleType = "n" | "s" | "e" | "w" | "rotate";

// ── Handle positions (relative to ellipse center, pre-rotation) ──────────────

function getHandlePos(e: CanvasEllipse, handle: HandleType) {
  const rad = (e.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  let lx = 0, ly = 0;
  if (handle === "n")      { lx = 0;    ly = -(e.ry + 14); }
  if (handle === "s")      { lx = 0;    ly =  (e.ry + 14); }
  if (handle === "e")      { lx = e.rx + 14; ly = 0; }
  if (handle === "w")      { lx = -(e.rx + 14); ly = 0; }
  if (handle === "rotate") { lx = 0;    ly = -(e.ry + 30); }

  return {
    x: e.cx + cos * lx - sin * ly,
    y: e.cy + sin * lx + cos * ly,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const EllipseLayer: React.FC<EllipseLayerProps> = ({
  ellipses, ctrlMode, selectedId, hoveredLegendId,
  onSelect, onChange, onRightClick, width, height,
}) => {
  const dragging = useRef<{
    type: "move" | HandleType;
    ellipse: CanvasEllipse;
    startMx: number; startMy: number;
  } | null>(null);

  // ── Window-level drag handling ────────────────────────────────────────────

  const startDrag = (
    type: "move" | HandleType,
    ellipse: CanvasEllipse,
    startMx: number,
    startMy: number,
  ) => {
    dragging.current = { type, ellipse, startMx, startMy };

    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const { type, ellipse, startMx, startMy } = dragging.current;
      const dx = e.clientX - startMx;
      const dy = e.clientY - startMy;

      if (type === "move") {
        onChange({ ...ellipse, cx: ellipse.cx + dx, cy: ellipse.cy + dy });
        dragging.current.startMx = e.clientX;
        dragging.current.startMy = e.clientY;
        dragging.current.ellipse = { ...ellipse, cx: ellipse.cx + dx, cy: ellipse.cy + dy };
        return;
      }

      if (type === "rotate") {
        const angle = Math.atan2(e.clientY - ellipse.cy, e.clientX - ellipse.cx);
        onChange({ ...ellipse, rotation: (angle * 180) / Math.PI + 90 });
        return;
      }

      const rad = (ellipse.rotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const ldx =  cos * dx + sin * dy;
      const ldy = -sin * dx + cos * dy;

      let updated = ellipse;
      if (type === "e") updated = { ...ellipse, rx: Math.max(20, ellipse.rx + ldx), cx: ellipse.cx + dx / 2, cy: ellipse.cy + dy / 2 };
      if (type === "w") updated = { ...ellipse, rx: Math.max(20, ellipse.rx - ldx), cx: ellipse.cx + dx / 2, cy: ellipse.cy + dy / 2 };
      if (type === "s") updated = { ...ellipse, ry: Math.max(20, ellipse.ry + ldy), cx: ellipse.cx + dx / 2, cy: ellipse.cy + dy / 2 };
      if (type === "n") updated = { ...ellipse, ry: Math.max(20, ellipse.ry - ldy), cx: ellipse.cx + dx / 2, cy: ellipse.cy + dy / 2 };
      onChange(updated);
      dragging.current.startMx = e.clientX;
      dragging.current.startMy = e.clientY;
      dragging.current.ellipse = updated;
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <svg
      style={{
        position: "absolute", top: 0, left: 0,
        width, height, overflow: "visible",
        zIndex: ctrlMode ? 5 : 1,
        pointerEvents: "none",
      }}
    >
      {ellipses.map(e => {
        const isSelected = e.id === selectedId;
        const isLegendHovered = e.id === hoveredLegendId;
        const showHandles = isSelected && ctrlMode;

        return (
          <g key={e.id} transform={`rotate(${e.rotation}, ${e.cx}, ${e.cy})`}>
            {/* Fill */}
            <ellipse
              cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
              fill={e.color}
              fillOpacity={isLegendHovered ? 0.18 : 0.08}
              stroke={e.color}
              strokeOpacity={isLegendHovered || isSelected ? 0.85 : 0.45}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray={isSelected ? "6 3" : "none"}
              style={{ cursor: ctrlMode ? "move" : "default", pointerEvents: ctrlMode ? "all" : "none" }}
              onMouseDown={ctrlMode ? (ev) => {
                ev.stopPropagation();
                onSelect(e.id);
                startDrag("move", e, ev.clientX, ev.clientY);
              } : undefined}
              onContextMenu={ctrlMode ? (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onRightClick(e, ev);
              } : undefined}
            />

            {/* Label */}
            <text
              x={e.cx} y={e.cy}
              textAnchor="middle" dominantBaseline="middle"
              fill={e.color} fontSize={12} opacity={0.7}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {e.label}
            </text>

            {/* Handles — only when selected in ctrl mode */}
            {showHandles && (["n", "s", "e", "w"] as HandleType[]).map(h => {
              const hp = getHandlePos(e, h);
              // getHandlePos already applies rotation, so render in un-rotated space
              // We need to invert the group rotation for handle positions
              const rad = (e.rotation * Math.PI) / 180;
              const cos = Math.cos(-rad);
              const sin = Math.sin(-rad);
              const dx = hp.x - e.cx;
              const dy = hp.y - e.cy;
              const lx = cos * dx - sin * dy;
              const ly = sin * dx + cos * dy;
              return (
                <rect
                  key={h}
                  x={e.cx + lx - 5} y={e.cy + ly - 5}
                  width={10} height={10}
                  fill="#1a1a2e" stroke="#88aaff" strokeWidth={1.5}
                  rx={2} style={{ cursor: "crosshair", pointerEvents: "all" }}
                  onMouseDown={(ev) => {
                    ev.stopPropagation();
                    startDrag(h, e, ev.clientX, ev.clientY);
                  }}
                />
              );
            })}

            {/* Rotation handle */}
            {showHandles && (() => {
              const hp = getHandlePos(e, "rotate");
              const rad = (e.rotation * Math.PI) / 180;
              const cos = Math.cos(-rad);
              const sin = Math.sin(-rad);
              const dx = hp.x - e.cx;
              const dy = hp.y - e.cy;
              const lx = cos * dx - sin * dy;
              const ly = sin * dx + cos * dy;
              return (
                <>
                  <line
                    x1={e.cx} y1={e.cy - e.ry - 14}
                    x2={e.cx} y2={e.cy - e.ry - 28}
                    stroke="#88aaff" strokeWidth={1} strokeDasharray="3 2"
                    style={{ pointerEvents: "none" }}
                  />
                  <circle
                    cx={e.cx + lx} cy={e.cy + ly} r={6}
                    fill="#1a1a2e" stroke="#88aaff" strokeWidth={1.5}
                    style={{ cursor: "grab", pointerEvents: "all" }}
                    onMouseDown={(ev) => {
                      ev.stopPropagation();
                      startDrag("rotate", e, ev.clientX, ev.clientY);
                    }}
                  />
                </>
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
};

export default EllipseLayer;