import React, { useState } from "react";
import { CanvasEllipse } from "./CanvasEllipse";
import { SynergyConnection } from "../data/SynergyEngine";
import { labelToColor } from "./labelToColor";
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
  onEditSynergyLabel: (label: string) => void; // right-click on a synergy label row
  ellipses: CanvasEllipse[];
  hiddenEllipses: Set<string>;
  onToggleEllipse: (id: string) => void;
  onEllipseLegendHover: (id: string | null) => void;
  onEllipseRightClick: (id: string) => void;
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
  onEditSynergyLabel,
  ellipses,
  hiddenEllipses,
  onToggleEllipse,
  onEllipseLegendHover,
  onEllipseRightClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // ── Build entry lists ─────────────────────────────────────────────────────

  const synergyLineEntries      = new Map<string, string>();
  const synergyHighlightEntries = new Map<string, string>();

  for (const conn of synergyConnections) {
    if (conn.highlightOnly) {
      if (!synergyHighlightEntries.has(conn.label))
        synergyHighlightEntries.set(conn.label, conn.color ?? labelToColor(conn.label));
    } else {
      if (!synergyLineEntries.has(conn.label))
        synergyLineEntries.set(conn.label, conn.color ?? labelToColor(conn.label));
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
    manualLineEntries.size > 0  || manualHighlightEntries.size > 0 ||
    ellipses.length > 0;

  if (!hasAnything && selectedCardCount < 2 && !editingLabel) return null;

  // ── Row renderers ─────────────────────────────────────────────────────────

  const renderRow = (
    label: string,
    color: string,
    isHighlightOnly: boolean,
    isManual: boolean,
    isSynergy: boolean = false,
    isSolid: boolean = true,
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
          cursor: isManual || isSynergy ? "context-menu" : "pointer",
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
          else if (isSynergy) onEditSynergyLabel(label);
        }}
      >
        {/* Swatch — line for regular, dot for highlight-only */}
        {isHighlightOnly ? (
          <div style={{
            width: 8, height: 8, flexShrink: 0, marginLeft: 6,
            borderRadius: "50%",
            background: isSolid ? color : "none",
            border: isSolid ? "none" : `2px solid ${color}`,
            boxShadow: hovered || isEditing ? "0 0 6px " + color : "none",
          }} />
        ) : (
          <div style={{
            width: 20, height: 3, flexShrink: 0,
            background: isSolid ? color : "none",
            border: isSolid ? "none" : `1px dashed ${color}`,
            borderRadius: 2,
            boxShadow: hovered || isEditing ? "0 0 6px " + color : "none",
          }} />
        )}

        <span style={{
          color: hovered || isEditing ? "white" : "#ccc",
          fontSize: "10px", flex: 1, lineHeight: 1.3,
        }}>
          {label}
        </span>

        {/* Edit hint for manual/synergy rows */}
        {(isManual || isSynergy) && !hidden && (
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
  let _skey = 0;  // unique key counter for sections array elements

  if (synergyLineEntries.size > 0) {
    if (sectionCount > 0) sections.push(<React.Fragment key={`div-${_skey++}`}>{renderDivider()}</React.Fragment>);
    sections.push(<React.Fragment key={`sec-${_skey++}`}>{renderSectionLabel("DETECTED")}</React.Fragment>);
    synergyLineEntries.forEach((color, label) => {
      const isSolid = synergyConnections.some(c => c.label === label && c.solid);
      sections.push(renderRow(label, color, false, false, true, isSolid));
    });
    sectionCount++;
  }

  if (synergyHighlightEntries.size > 0) {
    if (sectionCount > 0) sections.push(<React.Fragment key={`div-${_skey++}`}>{renderDivider()}</React.Fragment>);
    sections.push(<React.Fragment key={`sec-${_skey++}`}>{renderSectionLabel("ROLES")}</React.Fragment>);
    synergyHighlightEntries.forEach((color, label) => {
      const isSolid = synergyConnections.some(c => c.label === label && c.solid);
      sections.push(renderRow(label, color, true, false, true, isSolid));
    });
    sectionCount++;
  }

  if (manualLineEntries.size > 0) {
    if (sectionCount > 0) sections.push(<React.Fragment key={`div-${_skey++}`}>{renderDivider()}</React.Fragment>);
    sections.push(<React.Fragment key={`sec-${_skey++}`}>{renderSectionLabel("MANUAL")}</React.Fragment>);
    manualLineEntries.forEach((color, label) =>
      sections.push(renderRow(label, color, false, true, false, true))
    );
    sectionCount++;
  }

  if (manualHighlightEntries.size > 0) {
    if (sectionCount > 0) sections.push(<React.Fragment key={`div-${_skey++}`}>{renderDivider()}</React.Fragment>);
    sections.push(<React.Fragment key={`sec-${_skey++}`}>{renderSectionLabel("GROUPS")}</React.Fragment>);
    manualHighlightEntries.forEach((color, label) =>
      sections.push(renderRow(label, color, true, true, false, true))
    );
    sectionCount++;
  }

  if (ellipses.length > 0) {
    if (sectionCount > 0) sections.push(<React.Fragment key={`div-${_skey++}`}>{renderDivider()}</React.Fragment>);
    sections.push(<React.Fragment key={`sec-${_skey++}`}>{renderSectionLabel("REGIONS")}</React.Fragment>);
    ellipses.forEach(el => {
      const hidden  = hiddenEllipses.has(el.id);
      sections.push(
        <div
          key={el.id}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginBottom: "4px", opacity: hidden ? 0.3 : 1,
            cursor: "default",
          }}
          onMouseEnter={() => { if (!hidden) onEllipseLegendHover(el.id); }}
          onMouseLeave={() => onEllipseLegendHover(null)}
          onContextMenu={e => { e.preventDefault(); onEllipseRightClick(el.id); }}
        >
          {/* Ellipse swatch */}
          <svg width={20} height={12} style={{ flexShrink: 0 }}>
            <ellipse cx={10} cy={6} rx={9} ry={5}
              fill={el.color} fillOpacity={0.2}
              stroke={el.color} strokeOpacity={0.7} strokeWidth={1.5} />
          </svg>
          <span style={{ color: "#ccc", fontSize: "10px", flex: 1, lineHeight: 1.3 }}>
            {el.label}
          </span>
          <button
            onClick={() => onToggleEllipse(el.id)}
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
    });
    sectionCount++;
  }

  // ── Edit mode hint ────────────────────────────────────────────────────────

  const editHint = editingLabel && (
    <>
      <React.Fragment key="edit-hint-div">{renderDivider()}</React.Fragment>
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