import React, { useState } from "react";
import { SynergyConnection, SYNERGY_COLORS } from "../data/SynergyEngine";
import { ManualConnection } from "../data/ManualConnection";

interface LegendProps {
  synergyConnections: SynergyConnection[];
  manualConnections: ManualConnection[];
  hiddenLabels: Set<string>;
  legendHoveredLabel: string | null;
  isHoveringCard: boolean;
  hasHighlightedCard: boolean;
  selectedCardCount: number;
  editingLabel: string | null;        // label currently in edit mode (card right-clicks toggle membership)
  onToggleLabel: (label: string) => void;
  onLabelHover: (label: string | null) => void;
  onTagSelection: () => void;
  onEditLabel: (label: string) => void;   // right-click on a manual label row
}

const Legend: React.FC<LegendProps> = ({
  synergyConnections,
  manualConnections,
  hiddenLabels,
  legendHoveredLabel,
  isHoveringCard,
  hasHighlightedCard,
  selectedCardCount,
  editingLabel,
  onToggleLabel,
  onLabelHover,
  onTagSelection,
  onEditLabel,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // ── Build entry lists ─────────────────────────────────────────────────────

  const synergyLineEntries      = new Map<string, string>();
  const synergyHighlightEntries = new Map<string, string>();

  for (const conn of synergyConnections) {
    if (conn.highlightOnly) {
      if (!synergyHighlightEntries.has(conn.label))
        synergyHighlightEntries.set(conn.label, SYNERGY_COLORS[conn.category]);
    } else {
      if (!synergyLineEntries.has(conn.label))
        synergyLineEntries.set(conn.label, SYNERGY_COLORS[conn.category]);
    }
  }

  const manualLineEntries      = new Map<string, string>();
  const manualHighlightEntries = new Map<string, string>();

  for (const conn of manualConnections) {
    if (conn.highlightOnly) {
      manualHighlightEntries.set(conn.label, conn.color);
    } else {
      manualLineEntries.set(conn.label, conn.color);
    }
  }

  const hasAnything =
    synergyLineEntries.size > 0 || synergyHighlightEntries.size > 0 ||
    manualLineEntries.size > 0  || manualHighlightEntries.size > 0;

  if (!hasAnything && selectedCardCount < 2 && !editingLabel) return null;

  // ── Row renderers ─────────────────────────────────────────────────────────

  const renderRow = (
    label: string,
    color: string,
    isHighlightOnly: boolean,
    isManual: boolean,
  ) => {
    const hidden    = hiddenLabels.has(label);
    const hovered   = legendHoveredLabel === label;
    const isEditing = editingLabel === label;

    return (
      <div
        key={label}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          marginBottom: "4px", opacity: hidden ? 0.3 : 1,
          cursor: isManual ? "context-menu" : "pointer",
          background: isEditing ? "rgba(136,170,255,0.1)" : "none",
          borderRadius: 3,
          padding: "1px 2px",
          outline: isEditing ? "1px solid #446" : "none",
        }}
        onMouseEnter={() => {
          if (!hidden && !isHoveringCard && !hasHighlightedCard) onLabelHover(label);
        }}
        onMouseLeave={() => onLabelHover(null)}
        onContextMenu={e => {
          e.preventDefault();
          if (isManual) onEditLabel(label);
        }}
      >
        {/* Swatch — line for regular, dot for highlight-only */}
        {isHighlightOnly ? (
          <div style={{
            width: 8, height: 8, flexShrink: 0, marginLeft: 6,
            borderRadius: "50%", background: color,
            boxShadow: hovered || isEditing ? "0 0 6px " + color : "none",
          }} />
        ) : (
          <div style={{
            width: 20, height: 3, flexShrink: 0,
            background: color, borderRadius: 2,
            boxShadow: hovered || isEditing ? "0 0 6px " + color : "none",
          }} />
        )}

        <span style={{
          color: hovered || isEditing ? "white" : "#ccc",
          fontSize: "10px", flex: 1, lineHeight: 1.3,
        }}>
          {label}
        </span>

        {/* Edit hint for manual rows */}
        {isManual && !hidden && (
          <span style={{ color: "#444", fontSize: "9px", flexShrink: 0 }}>✎</span>
        )}

        {/* Hide/show toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleLabel(label); onLabelHover(null); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: hidden ? "#555" : "#777", fontSize: "10px",
            padding: "0 2px", lineHeight: 1, flexShrink: 0,
          }}
        >
          {hidden ? "◯" : "●"}
        </button>
      </div>
    );
  };

  const renderSectionLabel = (text: string) => (
    <div style={{ color: "#555", fontSize: "9px", letterSpacing: "0.05em", marginBottom: 4 }}>
      {text}
    </div>
  );

  const renderDivider = () => (
    <div style={{ borderTop: "1px solid #333", margin: "6px 0" }} />
  );

  // ── Assemble sections ─────────────────────────────────────────────────────

  const sections: React.ReactNode[] = [];
  let sectionCount = 0;

  if (synergyLineEntries.size > 0) {
    if (sectionCount > 0) sections.push(renderDivider());
    sections.push(renderSectionLabel("DETECTED"));
    synergyLineEntries.forEach((color, label) =>
      sections.push(renderRow(label, color, false, false))
    );
    sectionCount++;
  }

  if (synergyHighlightEntries.size > 0) {
    if (sectionCount > 0) sections.push(renderDivider());
    sections.push(renderSectionLabel("ROLES"));
    synergyHighlightEntries.forEach((color, label) =>
      sections.push(renderRow(label, color, true, false))
    );
    sectionCount++;
  }

  if (manualLineEntries.size > 0) {
    if (sectionCount > 0) sections.push(renderDivider());
    sections.push(renderSectionLabel("MANUAL"));
    manualLineEntries.forEach((color, label) =>
      sections.push(renderRow(label, color, false, true))
    );
    sectionCount++;
  }

  if (manualHighlightEntries.size > 0) {
    if (sectionCount > 0) sections.push(renderDivider());
    sections.push(renderSectionLabel("GROUPS"));
    manualHighlightEntries.forEach((color, label) =>
      sections.push(renderRow(label, color, true, true))
    );
    sectionCount++;
  }

  // ── Edit mode hint ────────────────────────────────────────────────────────

  const editHint = editingLabel && (
    <>
      {renderDivider()}
      <div style={{
        fontSize: "9px", color: "#88aaff", lineHeight: 1.4,
        padding: "2px 0",
      }}>
        Editing "{editingLabel}"<br />
        Click cards to add/remove
      </div>
    </>
  );

  return (
    <div style={{
      position: "absolute", top: 10, left: 10,
      background: "rgba(0,0,0,0.80)", border: "1px solid #444",
      borderRadius: "6px", zIndex: 10, userSelect: "none",
      minWidth: collapsed ? "auto" : "165px",
      maxHeight: collapsed ? "auto" : "80%",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 10px", cursor: "pointer",
          borderBottom: collapsed ? "none" : "1px solid #333",
        }}
      >
        <span style={{ color: "#aaa", fontSize: "10px", letterSpacing: "0.05em" }}>
          CONNECTIONS
          {editingLabel && <span style={{ color: "#88aaff", marginLeft: 6 }}>✎</span>}
        </span>
        <span style={{ color: "#666", fontSize: "10px", marginLeft: 8 }}>
          {collapsed ? "▼" : "▲"}
        </span>
      </div>

      {!collapsed && (
        <div style={{ padding: "6px 10px 8px", overflowY: "auto", maxHeight: "60vh" }}>
          {sections}
          {editHint}

          {selectedCardCount >= 2 && !editingLabel && (
            <>
              {sectionCount > 0 && renderDivider()}
              <button
                onClick={onTagSelection}
                style={{
                  width: "100%", padding: "5px 0",
                  background: "#223", border: "1px solid #446",
                  borderRadius: 4, color: "#88aaff",
                  cursor: "pointer", fontSize: "10px",
                  letterSpacing: "0.04em",
                }}
              >
                + Tag {selectedCardCount} selected cards
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Legend;