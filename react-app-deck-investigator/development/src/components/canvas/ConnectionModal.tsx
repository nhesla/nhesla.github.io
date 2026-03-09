import React, { useState, useRef } from "react";
import { SynergyDirection } from "../data/SynergyEngine";
import { ManualConnection, MANUAL_COLOR_PRESETS, MANUAL_CONNECTION_DEFAULTS } from "../data/ManualConnection";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConnectionModalMode =
  | "single"           // one card → one card (new connection)
  | "multi"            // one card → many selected cards (new)
  | "group"            // all selected cards → mesh (new)
  | "edit-label"       // editing all connections sharing a label
  | "edit-connection"  // editing one specific connection
  | "ellipse";         // editing a canvas ellipse region

interface ConnectionModalProps {
  mode: ConnectionModalMode;

  // new connection modes
  from?: string;
  to?: string;
  targetCount?: number;

  // edit modes — provide the existing connection(s) to pre-fill
  editingLabel?: string;          // for edit-label
  editingConnection?: ManualConnection; // for edit-connection

  onConfirm: (label: string, color: string, direction: SynergyDirection, highlightOnly: boolean) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const DIRECTION_OPTIONS: { value: SynergyDirection; label: string }[] = [
  { value: "forward",       label: "A → B" },
  { value: "bidirectional", label: "A ↔ B" },
  { value: "none",          label: "None"  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  mode,
  from, to, targetCount,
  editingLabel, editingConnection,
  onConfirm, onDelete, onCancel,
}) => {
  // Pre-fill from existing connection when in edit mode
  const initial = editingConnection ?? {
    label:       editingLabel ?? MANUAL_CONNECTION_DEFAULTS.label,
    color:       MANUAL_CONNECTION_DEFAULTS.color,
    direction:   MANUAL_CONNECTION_DEFAULTS.direction,
    highlightOnly: MANUAL_CONNECTION_DEFAULTS.highlightOnly,
  };

  const [label,        setLabel]        = useState(initial.label);
  const [color,        setColor]        = useState(initial.color);
  const [customHex,    setCustomHex]    = useState("");
  const [direction,    setDirection]    = useState<SynergyDirection>(initial.direction);
  const [highlightOnly, setHighlightOnly] = useState(initial.highlightOnly);

  // ── Drag to move ──────────────────────────────────────────────────────────
  const [pos,     setPos]     = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragStart.current = { mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top };
    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      setPos({
        x: dragStart.current.px + ev.clientX - dragStart.current.mx,
        y: dragStart.current.py + ev.clientY - dragStart.current.my,
      });
    };
    const onUp = () => {
      dragStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const isEditMode = mode === "edit-label" || mode === "edit-connection";

  const activeColor = customHex.match(/^#[0-9a-fA-F]{6}$/) ? customHex : color;

  const handleCustomHex = (val: string) => {
    setCustomHex(val);
    if (val.match(/^#[0-9a-fA-F]{6}$/)) setColor("");
  };

  const handleSwatchClick = (preset: string) => {
    setColor(preset);
    setCustomHex("");
  };

  // ── Header ────────────────────────────────────────────────────────────────

  const renderHeader = () => {
    switch (mode) {
      case "single":
        return from && to ? (
          <div style={{ marginBottom: 12, fontSize: 11, color: "#ccc" }}>
            <span style={{ color: "#88aaff" }}>{from}</span>
            <span style={{ color: "#666", margin: "0 6px" }}>→</span>
            <span style={{ color: "#88aaff" }}>{to}</span>
          </div>
        ) : null;

      case "multi":
        return from && targetCount ? (
          <div style={{ marginBottom: 12, fontSize: 11, color: "#ccc" }}>
            <span style={{ color: "#88aaff" }}>{from}</span>
            <span style={{ color: "#666", margin: "0 6px" }}>→</span>
            <span style={{ color: "#88aaff" }}>{targetCount} selected cards</span>
          </div>
        ) : null;

      case "group":
        return (
          <div style={{ marginBottom: 12, fontSize: 11, color: "#ccc" }}>
            <span style={{ color: "#88aaff" }}>{targetCount} cards</span>
            <span style={{ color: "#666", margin: "0 6px" }}>↔</span>
            <span style={{ color: "#aaa" }}>full mesh</span>
          </div>
        );

      case "edit-label":
        return (
          <div style={{ marginBottom: 12, fontSize: 11, color: "#ccc" }}>
            <span style={{ color: "#aaa" }}>Editing all </span>
            <span style={{ color: "#88aaff" }}>"{editingLabel}"</span>
            <span style={{ color: "#aaa" }}> connections</span>
          </div>
        );

      case "edit-connection":
        return editingConnection ? (
          <div style={{ marginBottom: 12, fontSize: 11, color: "#ccc" }}>
            <span style={{ color: "#88aaff" }}>{editingConnection.from}</span>
            <span style={{ color: "#666", margin: "0 6px" }}>→</span>
            <span style={{ color: "#88aaff" }}>{editingConnection.to}</span>
          </div>
        ) : null;
    }
  };

  // ── Title ─────────────────────────────────────────────────────────────────

  const title = () => {
    switch (mode) {
      case "group":        return "TAG SELECTION";
      case "edit-label":   return "EDIT GROUP";
      case "edit-connection": return "EDIT CONNECTION";
      case "ellipse":      return "EDIT REGION";
      default:             return "NEW CONNECTION";
    }
  };

  // ── Confirm label ─────────────────────────────────────────────────────────

  const confirmLabel = () => {
    switch (mode) {
      case "group":           return "Tag";
      case "edit-label":
      case "edit-connection":
      case "ellipse":         return "Save";
      default:                return "Add";
    }
  };

  return (
    <div style={{
      position: "fixed",
      ...(pos ? { left: pos.x, top: pos.y } : { bottom: 16, right: 16 }),
      width: 240,
      background: "#1a1a2e",
      border: "1px solid #556",
      borderRadius: 8,
      padding: "14px 16px",
      zIndex: 20,
      boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
      color: "white",
      fontSize: 12,
    }}>

      {/* Title — drag handle */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          marginBottom: 8, color: "#aaa", fontSize: 11, letterSpacing: "0.05em",
          cursor: "grab", display: "flex", alignItems: "center", gap: 6,
          userSelect: "none",
        }}
      >
        <span style={{ color: "#444", fontSize: 10 }}>⠿</span>
        {title()}
      </div>
      {renderHeader()}

      {/* Label */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#888", marginBottom: 4 }}>Label</div>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{
            width: "100%", background: "#111", border: "1px solid #445",
            borderRadius: 4, color: "white", padding: "4px 8px",
            fontSize: 12, boxSizing: "border-box",
          }}
        />
      </div>

      {/* Direction — hidden when highlight-only or ellipse */}
      {!highlightOnly && mode !== "ellipse" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: "#888", marginBottom: 4 }}>
            Direction
            {mode === "edit-label" && (
              <span style={{ color: "#555", fontSize: 10, marginLeft: 6 }}>(applies to all)</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {DIRECTION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDirection(opt.value)}
                style={{
                  flex: 1, padding: "4px 0",
                  background: direction === opt.value ? "#334" : "#111",
                  border: direction === opt.value ? "1px solid #88aaff" : "1px solid #445",
                  borderRadius: 4,
                  color: direction === opt.value ? "#88aaff" : "#888",
                  cursor: "pointer", fontSize: 11,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#888", marginBottom: 6 }}>Color</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {MANUAL_COLOR_PRESETS.map(preset => (
            <div
              key={preset}
              onClick={() => handleSwatchClick(preset)}
              style={{
                width: 20, height: 20, borderRadius: "50%",
                background: preset, cursor: "pointer",
                border: color === preset && !customHex.match(/^#[0-9a-fA-F]{6}$/)
                  ? "2px solid white" : "2px solid transparent",
                boxSizing: "border-box",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: activeColor, border: "1px solid #556", flexShrink: 0,
          }} />
          <input
            value={customHex}
            onChange={e => handleCustomHex(e.target.value)}
            placeholder="#rrggbb"
            style={{
              flex: 1, background: "#111", border: "1px solid #445",
              borderRadius: 4, color: "white", padding: "4px 8px", fontSize: 12,
            }}
          />
        </div>
      </div>

      {/* Preview line */}
      {!highlightOnly && mode !== "ellipse" && (
        <div style={{ marginBottom: 10 }}>
          <svg width="100%" height="20" style={{ overflow: "visible" }}>
            <line
              x1="10" y1="10" x2="210" y2="10"
              stroke={activeColor} strokeWidth="2"
              strokeDasharray={mode === "edit-connection" || isEditMode ? "none" : (direction === "none" ? "none" : "6 4")}
            />
            {(direction === "forward" || direction === "bidirectional") && (
              <polygon points="210,6 210,14 218,10" fill={activeColor} />
            )}
            {direction === "bidirectional" && (
              <polygon points="10,6 10,14 2,10" fill={activeColor} />
            )}
          </svg>
        </div>
      )}

      {/* Highlight only toggle */}
      {mode !== "ellipse" && (
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            id="highlight-only"
            checked={highlightOnly}
            onChange={e => setHighlightOnly(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <label htmlFor="highlight-only" style={{ color: "#888", fontSize: 11, cursor: "pointer" }}>
            Highlight only (no visible line)
          </label>
        </div>
      )}

      {/* Delete button — edit modes only */}
      {(isEditMode || mode === "ellipse") && onDelete && (
        <button
          onClick={onDelete}
          style={{
            width: "100%", padding: "6px 0", marginBottom: 8,
            background: "none", border: "1px solid #622",
            borderRadius: 4, color: "#e55",
            cursor: "pointer", fontSize: 12,
          }}
        >
          {mode === "edit-label" ? "Delete all connections in group" : mode === "ellipse" ? "Delete region" : "Delete connection"}
        </button>
      )}

      {/* Confirm / Cancel */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "6px 0",
            background: "none", border: "1px solid #445",
            borderRadius: 4, color: "#888",
            cursor: "pointer", fontSize: 12,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(label, activeColor, direction, highlightOnly)}
          style={{
            flex: 1, padding: "6px 0",
            background: "#223", border: "1px solid #88aaff",
            borderRadius: 4, color: "#88aaff",
            cursor: "pointer", fontSize: 12,
          }}
        >
          {confirmLabel()}
        </button>
      </div>
    </div>
  );
};

export default ConnectionModal;