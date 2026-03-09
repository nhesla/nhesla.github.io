import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../data/CardImporter";
import { SynergyConnection, SynergyDirection, SYNERGY_COLORS } from "../data/SynergyEngine";
import {
  ManualConnection,
  makeManualConnection,
  makeManualMesh,
  makeManualStar,
  updateConnectionsByLabel,
  updateConnectionById,
  removeConnectionsByLabel,
  removeConnectionById,
  getMostCommonFrom,
  cardIsInLabelGroup,
} from "../data/ManualConnection";
import { runForceLayout, Position } from "./ForceLayout";
import { useBoxSelect } from "./useBoxSelect";
import SynergyLines from "./SynergyLines";
import CardToken from "./CardToken";
import Legend from "./Legend";
import ConnectionModal from "./ConnectionModal";
import { ConnectionModalMode } from "./ConnectionModal";
import { canvasWidth, canvasHeight, LEGEND_MARGIN, getPos } from "./canvasUtils";
import { CanvasEllipse, createEllipse, getEllipseMembers } from "./CanvasEllipse";
import EllipseLayer from "./EllipseLayer";
import { labelToColor } from "./labelToColor";

interface CanvasProps {
  cards: Card[] | null;
  synergyConnections: SynergyConnection[];
  positionMap: Record<string, Position>;
  manualConnections: ManualConnection[];
  onPositionMapChange: (map: Record<string, Position>) => void;
  onManualConnectionsChange: (conns: ManualConnection[]) => void;
  onSynergyConnectionsChange: (conns: SynergyConnection[]) => void;
  ellipses: CanvasEllipse[];
  onEllipsesChange: (ellipses: CanvasEllipse[]) => void;
  disabledCards: Set<string>;
  onToggleDisabled: (cardname: string) => void;
  onClickCard: (card: Card) => void;
  onMouseOver: (card: Card) => void;
  onMouseLeave: () => void;
}

type PendingConnection =
  | { mode: "single";              from: string; to: string }
  | { mode: "multi";               from: string; targets: string[] }
  | { mode: "group";               targets: string[] }
  | { mode: "edit-label";          label: string }
  | { mode: "edit-connection";     connection: ManualConnection }
  | { mode: "edit-synergy-label";  label: string };

type ActiveHighlight =
  | { mode: "card";  cardName: string }
  | { mode: "label"; label: string }
  | null;

const Canvas: React.FC<CanvasProps> = ({
  cards,
  synergyConnections,
  positionMap,
  manualConnections,
  onPositionMapChange,
  onManualConnectionsChange,
  onSynergyConnectionsChange,
  ellipses,
  onEllipsesChange,
  disabledCards,
  onToggleDisabled,
  onClickCard,
  onMouseOver,
  onMouseLeave,
}) => {

  // ── Layout ──────────────────────────────────────────────────────────────────

  const runLayout = useCallback(() => {
    if (!cards) return;
    const positions = runForceLayout(cards, synergyConnections, LEGEND_MARGIN);
    onPositionMapChange(positions);
  }, [cards, synergyConnections]);

  useEffect(() => { if (cards) runLayout(); }, [cards]);

  const updateCardPosition = (cardname: string, x: number, y: number) => {
    onPositionMapChange({ ...positionMap, [cardname]: { x, y } });
  };

  // ── Hover / highlight ───────────────────────────────────────────────────────

  const [highlightedCard, setHighlightedCard] = useState<Card | null>(null);
  const [isHoveringCard,  setIsHoveringCard]  = useState(false);
  const [hoveredCard,     setHoveredCard]     = useState<string | null>(null);

  // ── Manual connections ──────────────────────────────────────────────────────

  // ── Pending modal state ─────────────────────────────────────────────────────

  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  // ── Label edit mode ─────────────────────────────────────────────────────────
  // When set, right-clicking a card toggles it in/out of this label group

  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  // ── Ctrl mode (line selection) ──────────────────────────────────────────────

  const [ctrlMode,      setCtrlMode]      = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrlMode(true);
      if (e.key === "Escape") {
        setEditingLabel(null);
        setSelectedLineId(null);
        setSelectedEllipseId(null);
        setPendingConnection(null);
        setHighlightedCard(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        setCtrlMode(false);
        setSelectedLineId(null);
        setSelectedEllipseId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, []);

  // ── Right-click handler ─────────────────────────────────────────────────────

  // ── Card toggle in label edit mode ─────────────────────────────────────────

  const handleCardToggleInGroup = (card: Card) => {
    if (!editingLabel) return;
    const alreadyIn = cardIsInLabelGroup(manualConnections, editingLabel, card.cardname);
    if (alreadyIn) {
      onManualConnectionsChange(manualConnections.filter(c => !(c.label === editingLabel &&
          (c.from === card.cardname || c.to === card.cardname)))
      );
    } else {
      const labelConns = manualConnections.filter(c => c.label === editingLabel);
      if (labelConns.length === 0) return;
      const firstConn = labelConns[0];
      const { direction, color, highlightOnly } = firstConn;
      let newConn: ManualConnection;
      if (direction === "none" || direction === "bidirectional") {
        const otherCard = firstConn.from !== card.cardname ? firstConn.from : firstConn.to;
        newConn = makeManualConnection(otherCard, card.cardname, editingLabel, color, direction, highlightOnly);
      } else {
        const commonFrom = getMostCommonFrom(manualConnections, editingLabel) ?? firstConn.from;
        newConn = makeManualConnection(commonFrom, card.cardname, editingLabel, color, direction, highlightOnly);
      }
      onManualConnectionsChange([...manualConnections, newConn]);
    }
  };

  // ── Right-click handler ─────────────────────────────────────────────────────

  const handleRightClick = (card: Card, e: React.MouseEvent) => {
    e.preventDefault();
    if (editingLabel) return; // clicks handled by cardClick in this mode

    // Multi-select mode: open multi modal
    if (selectedCards.size > 0) {
      const targets = Array.from(selectedCards).filter(n => n !== card.cardname);
      if (targets.length > 0) {
        setPendingConnection({ mode: "multi", from: card.cardname, targets });
        return;
      }
    }

    // Normal: set highlighted card for manual connection flow
    setPendingConnection(null);
    setHighlightedCard(card);
  };

  // ── Left-click card (complete single connection) ────────────────────────────

  const handleCardLeftClick = (card: Card) => {
    if (!highlightedCard) return;
    const a = highlightedCard.cardname, b = card.cardname;
    if (a === b) { setHighlightedCard(null); return; }
    setPendingConnection({ mode: "single", from: a, to: b });
    setHighlightedCard(null);
  };

  // ── Tag selection ───────────────────────────────────────────────────────────

  const handleTagSelection = () => {
    if (selectedCards.size < 2) return;
    setPendingConnection({ mode: "group", targets: Array.from(selectedCards) });
  };

  // ── Line click (ctrl mode) ──────────────────────────────────────────────────

  const handleLineClick = (conn: ManualConnection) => {
    setSelectedLineId(conn.id);
    setPendingConnection({ mode: "edit-connection", connection: conn });
  };

  // ── Legend label right-click ────────────────────────────────────────────────

  const handleEditLabel = (label: string) => {
    // Open edit modal for the label group
    setPendingConnection({ mode: "edit-label", label });
    // Also enter label edit mode so card right-clicks toggle membership
    setEditingLabel(label);
  };

  const handleEditSynergyLabel = (label: string) => {
    setPendingConnection({ mode: "edit-synergy-label", label });
  };

  // ── Modal confirm ───────────────────────────────────────────────────────────

  const handleModalConfirm = (
    label: string,
    color: string,
    direction: SynergyDirection,
    highlightOnly: boolean,
  ) => {
    if (!pendingConnection) return;

    if (pendingConnection.mode === "single") {
      onManualConnectionsChange([...manualConnections, makeManualConnection(
        pendingConnection.from, pendingConnection.to,
        label, color, direction, highlightOnly,
      )]);

    } else if (pendingConnection.mode === "multi") {
      onManualConnectionsChange([...manualConnections, ...makeManualStar(
        pendingConnection.from, pendingConnection.targets,
        label, color, direction, highlightOnly,
      )]);

    } else if (pendingConnection.mode === "group") {
      onManualConnectionsChange([...manualConnections, ...makeManualMesh(
        pendingConnection.targets,
        label, color, direction, highlightOnly,
      )]);

    } else if (pendingConnection.mode === "edit-label") {
      const oldLabel = pendingConnection.label;
      onManualConnectionsChange(
        updateConnectionsByLabel(manualConnections, oldLabel, { label, color, direction, highlightOnly })
      );
      setEditingLabel(null);

    } else if (pendingConnection.mode === "edit-connection") {
      onManualConnectionsChange(
        updateConnectionById(manualConnections, pendingConnection.connection.id, { label, color, direction, highlightOnly })
      );
      setSelectedLineId(null);

    } else if (pendingConnection.mode === "edit-synergy-label") {
      const oldLabel = pendingConnection.label;
      onSynergyConnectionsChange(synergyConnections.map(c =>
        c.label === oldLabel ? { ...c, label, color, solid: !highlightOnly } : c
      ));
    }

    setPendingConnection(null);
    setEditingLabel(null);
  };

  // ── Modal delete ────────────────────────────────────────────────────────────

  const handleModalDelete = () => {
    if (!pendingConnection) return;
    if (pendingConnection.mode === "edit-label") {
      onManualConnectionsChange(removeConnectionsByLabel(manualConnections, pendingConnection.label));
      setEditingLabel(null);
    } else if (pendingConnection.mode === "edit-connection") {
      onManualConnectionsChange(removeConnectionById(manualConnections, pendingConnection.connection.id));
      setSelectedLineId(null);
    } else if (pendingConnection.mode === "edit-synergy-label") {
      // Delete all synergy connections with this label
      onSynergyConnectionsChange(synergyConnections.filter(c => c.label !== pendingConnection.label));
    }
    setPendingConnection(null);
  };

  // ── Modal cancel ────────────────────────────────────────────────────────────

  const handleModalCancel = () => {
    setPendingConnection(null);
    setSelectedLineId(null);
    setEditingLabel(null);
  };

  // ── Legend ──────────────────────────────────────────────────────────────────

  const [hiddenLabels,       setHiddenLabels]       = useState<Set<string>>(new Set());
  const [legendHoveredLabel, setLegendHoveredLabel] = useState<string | null>(null);
  const [alwaysShowLabels,   setAlwaysShowLabels]   = useState(true);
  const [selectedEllipseId,  setSelectedEllipseId]  = useState<string | null>(null);
  const [hoveredEllipseId,   setHoveredEllipseId]   = useState<string | null>(null);
  const [hiddenEllipses,     setHiddenEllipses]     = useState<Set<string>>(new Set());

  const toggleLabel = (label: string) => {
    setHiddenLabels(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  // ── Box select ──────────────────────────────────────────────────────────────

  const [boxState, boxHandlers] = useBoxSelect(
    cards, positionMap, onPositionMapChange, canvasWidth, canvasHeight,
  );

  const { selectedCards, selectionRect, groupDragAnchor } = boxState;
  const {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleSelectedCardMouseDown,
    setSelectedCards,
  } = boxHandlers;

  // ── Active highlight ────────────────────────────────────────────────────────

  const getActiveHighlight = (): ActiveHighlight => {
    if (highlightedCard) return null;
    if (hoveredCard) return { mode: "card", cardName: hoveredCard };
    if (legendHoveredLabel) return { mode: "label", label: legendHoveredLabel };
    return null;
  };

  // ── Glow color for highlight-only labels ────────────────────────────────────

  const getGlowColor = (cardname: string): string | undefined => {
    // Ellipse legend hover — glow cards inside the hovered ellipse
    if (hoveredEllipseId) {
      const ellipse = ellipses.find(e => e.id === hoveredEllipseId);
      if (ellipse) {
        const members = getEllipseMembers(ellipse, cards ?? [], positionMap);
        if (members.includes(cardname)) return ellipse.color;
      }
    }

    const active = getActiveHighlight();
    if (!active || active.mode !== "label") {
      // Also glow if this card is in the currently-editing label group
      if (editingLabel && cardIsInLabelGroup(manualConnections, editingLabel, cardname)) {
        const conn = manualConnections.find(c => c.label === editingLabel);
        return conn?.color ?? "#88aaff";
      }
      return undefined;
    }

    const label = active.label;
    const synergyMatch = synergyConnections.find(
      c => c.highlightOnly && c.label === label &&
           (c.from === cardname || c.to === cardname)
    );
    if (synergyMatch) return SYNERGY_COLORS[synergyMatch.category];

    const manualMatch = manualConnections.find(
      c => c.highlightOnly && c.label === label &&
           (c.from === cardname || c.to === cardname)
    );
    if (manualMatch) return manualMatch.color;

    return undefined;
  };

  // ── Flag dots for card corners ─────────────────────────────────────────────

  const getCardFlags = (cardname: string): { color: string; label: string; solid?: boolean }[] => {
    const seen = new Map<string, { color: string; solid?: boolean }>(); // label -> {color, solid}

    for (const conn of synergyConnections) {
      if (conn.highlightOnly && (conn.from === cardname || conn.to === cardname)) {
        if (!seen.has(conn.label))
          seen.set(conn.label, { color: conn.color ?? labelToColor(conn.label), solid: conn.solid });
      }
    }
    for (const conn of manualConnections) {
      if (conn.highlightOnly && (conn.from === cardname || conn.to === cardname)) {
        if (!seen.has(conn.label))
          seen.set(conn.label, { color: conn.color, solid: true }); // manual = always solid
      }
    }

    return Array.from(seen.entries()).map(([label, { color, solid }]) => ({ label, color, solid }));
  };

  // ── Modal props helper ──────────────────────────────────────────────────────

  const getModalProps = () => {
    if (!pendingConnection) return null;
    const base = { onConfirm: handleModalConfirm, onCancel: handleModalCancel };

    switch (pendingConnection.mode) {
      case "single":
        return { ...base, mode: "single" as ConnectionModalMode,
          from: pendingConnection.from, to: pendingConnection.to };

      case "multi":
        return { ...base, mode: "multi" as ConnectionModalMode,
          from: pendingConnection.from, targetCount: pendingConnection.targets.length };

      case "group":
        return { ...base, mode: "group" as ConnectionModalMode,
          targetCount: pendingConnection.targets.length };

      case "edit-label":
        return { ...base, mode: "edit-label" as ConnectionModalMode,
          editingLabel: pendingConnection.label,
          editingConnection: manualConnections.find(c => c.label === pendingConnection.label),
          onDelete: handleModalDelete };

      case "edit-synergy-label": {
        const syns = synergyConnections.filter(c => c.label === pendingConnection.label);
        const isSolid = syns.some(c => c.solid);
        const storedColor = syns[0]?.color ?? labelToColor(pendingConnection.label);
        return { ...base, mode: "edit-label" as ConnectionModalMode,
          editingLabel: pendingConnection.label,
          editingConnection: syns.length > 0 ? {
            id: "", from: "", to: "",
            label: pendingConnection.label,
            color: storedColor,
            direction: syns[0].direction ?? "bidirectional",
            highlightOnly: !isSolid,
          } : undefined,
          onDelete: handleModalDelete };
      }

      case "edit-connection":
        return { ...base, mode: "edit-connection" as ConnectionModalMode,
          editingConnection: pendingConnection.connection,
          onDelete: handleModalDelete };

      default: {
        // ellipse mode — stored as `any` since it's not in the PendingConnection union
        const pc = pendingConnection as any;
        if (pc.mode === "ellipse") {
          return {
            mode: "ellipse" as ConnectionModalMode,
            editingLabel: pc.label,
            onConfirm: (label: string, color: string) => {
              onEllipsesChange(ellipses.map(el =>
                el.id === pc.ellipseId ? { ...el, label, color } : el
              ));
              setPendingConnection(null);
            },
            onDelete: () => {
              onEllipsesChange(ellipses.filter(el => el.id !== pc.ellipseId));
              setSelectedEllipseId(null);
              setPendingConnection(null);
            },
            onCancel: () => setPendingConnection(null),
          };
        }
        return null;
      }
    }
  };

  // ── Ellipse right-click → modal ─────────────────────────────────────────────

  const handleEllipseRightClick = (ellipse: CanvasEllipse, e: React.MouseEvent) => {
    setSelectedEllipseId(ellipse.id);
    setPendingConnection({
      mode: "ellipse" as any,
      ellipseId: ellipse.id,
      label: ellipse.label,
      color: ellipse.color,
    } as any);
  };

  const modalProps = getModalProps();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 20px" }}>
        <button
          onClick={runLayout}
          style={{
            padding: "4px 12px", background: "#334", color: "white",
            border: "1px solid #558", cursor: "pointer", fontSize: "12px",
          }}
        >
          ↺ Re-layout
        </button>
        <button
          onClick={() => setAlwaysShowLabels(v => !v)}
          style={{
            padding: "4px 12px", fontSize: "12px", cursor: "pointer",
            background: alwaysShowLabels ? "#334" : "none",
            border: alwaysShowLabels ? "1px solid #88aaff" : "1px solid #558",
            color: alwaysShowLabels ? "#88aaff" : "#aaa",
          }}
        >
          ⌗ Labels
        </button>
        <button
          onClick={() => {
            const e = createEllipse(canvasWidth / 2, canvasHeight / 2);
            onEllipsesChange([...ellipses, e]);
          }}
          style={{
            padding: "4px 12px", fontSize: "12px", cursor: "pointer",
            background: "none", border: "1px solid #558", color: "#aaa",
          }}
        >
          ⬭ Add Region
        </button>
        {ctrlMode && (
          <span style={{ color: "#88aaff", fontSize: "11px" }}>
            Ctrl: click a line or region to edit
          </span>
        )}
        {editingLabel && !ctrlMode && (
          <span style={{ color: "#88aaff", fontSize: "11px" }}>
            Editing "{editingLabel}" — click cards to add/remove
          </span>
        )}
      </div>

      <div
        data-canvas
        style={{
          position: "relative", width: canvasWidth, height: canvasHeight,
          border: "1px solid white", margin: "0 20px 20px 20px", flexShrink: 0,
          userSelect: "none",
          cursor: ctrlMode ? "crosshair" : "default",
        }}
        onContextMenu={e => e.preventDefault()}
        onClick={e => {
          if ((e.target as HTMLElement) === e.currentTarget) {
            setHighlightedCard(null);
            if (!editingLabel) setSelectedLineId(null);
          }
        }}
        onMouseDown={e => {
          if (!ctrlMode && !editingLabel) handleCanvasMouseDown(e);
          if ((e.target as HTMLElement) === e.currentTarget) setHighlightedCard(null);
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <EllipseLayer
          ellipses={ellipses.filter(e => !hiddenEllipses.has(e.id))}
          ctrlMode={ctrlMode}
          selectedId={selectedEllipseId}
          hoveredLegendId={hoveredEllipseId}
          onSelect={setSelectedEllipseId}
          onChange={(updated) => onEllipsesChange(ellipses.map(el => el.id === updated.id ? updated : el))}
          onRightClick={handleEllipseRightClick}
          width={canvasWidth}
          height={canvasHeight}
        />
        <SynergyLines
          cards={cards ?? []}
          positionMap={positionMap}
          synergyConnections={synergyConnections}
          manualConnections={manualConnections}
          hiddenLabels={hiddenLabels}
          activeHighlight={getActiveHighlight()}
          selectionRect={selectionRect}
          ctrlMode={ctrlMode}
          selectedLineId={selectedLineId}
          onLineClick={handleLineClick}
          alwaysShowLabels={alwaysShowLabels}
          disabledCards={disabledCards}
        />

        {cards?.map((card, idx) => {
          if (!card.info || card.info.length === 0) return null;
          const pos             = getPos(card, positionMap);
          const isSelected      = selectedCards.has(card.cardname);
          const isGroupDragging = !!groupDragAnchor;

          const cardMouseEnter = () => {
            setIsHoveringCard(true);
            setHoveredCard(card.cardname);
            onMouseOver(card);
          };

          const cardMouseLeave = () => {
            setIsHoveringCard(false);
            setHoveredCard(null);
            onMouseLeave();
          };

          const cardClick = (e: React.MouseEvent) => {
            if (ctrlMode) return; // in ctrl mode, clicks go to lines only
            if (editingLabel) {
              handleCardToggleInGroup(card);
              return;
            }
            if (e.shiftKey) {
              const next = new Set(selectedCards);
              next.has(card.cardname) ? next.delete(card.cardname) : next.add(card.cardname);
              setSelectedCards(next);
            } else if (highlightedCard) {
              handleCardLeftClick(card);
            } else {
              onClickCard(card);
            }
          };

          return (
            <CardToken
              key={card.cardname + "-" + idx}
              card={card}
              pos={pos}
              isHighlighted={highlightedCard === card}
              isSelected={isSelected}
              isGroupDragging={isGroupDragging}
              glowColor={getGlowColor(card.cardname)}
              flags={getCardFlags(card.cardname)}
              isDisabled={disabledCards.has(card.cardname)}
              passthroughPointer={ctrlMode}
              onMouseEnter={cardMouseEnter}
              onMouseLeave={cardMouseLeave}
              onClick={cardClick}
              onContextMenu={e => handleRightClick(card, e)}
              onMouseDown={isSelected ? e => handleSelectedCardMouseDown(card, e) : undefined}
              onPositionChange={(x, y) => updateCardPosition(card.cardname, x, y)}
            />
          );
        })}

        <Legend
          synergyConnections={synergyConnections}
          manualConnections={manualConnections}
          hiddenLabels={hiddenLabels}
          legendHoveredLabel={legendHoveredLabel}
          isHoveringCard={isHoveringCard}
          hasHighlightedCard={highlightedCard !== null}
          selectedCardCount={selectedCards.size}
          editingLabel={editingLabel}
          onToggleLabel={toggleLabel}
          onLabelHover={setLegendHoveredLabel}
          onTagSelection={handleTagSelection}
          onEditLabel={handleEditLabel}
          onEditSynergyLabel={handleEditSynergyLabel}
          onEllipseLegendHover={setHoveredEllipseId}
          onEllipseRightClick={(id) => {
            const el = ellipses.find(e => e.id === id);
            if (el) handleEllipseRightClick(el, {} as React.MouseEvent);
          }}
          ellipses={ellipses}
          hiddenEllipses={hiddenEllipses}
          onToggleEllipse={(id) => setHiddenEllipses(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          })}
        />

        {modalProps && <ConnectionModal {...modalProps} />}
      </div>

      {/* ── Controls reference ── */}
      <ControlsReference />
    </div>
  );
};

export default Canvas;

// ── Controls reference ────────────────────────────────────────────────────────

const CONTROLS = [
  { input: "Left-click card",        action: "Open card details" },
  { input: "Right-click card",       action: "Start connection from card" },
  { input: "Left-click 2nd card",    action: "Complete connection" },
  { input: "Shift+click card",       action: "Add/remove from selection" },
  { input: "Click+drag canvas",      action: "Box-select multiple cards" },
  { input: "Right-click selected",   action: "Connect one → many" },
  { input: "Hold Ctrl",              action: "Line/region select mode" },
  { input: "Ctrl + click ellipse",   action: "Select region to move/resize/rotate" },
  { input: "Ctrl + right-click ellipse", action: "Edit region label & color" },
  { input: "Right-click legend row", action: "Edit all connections in group" },
  { input: "Escape",                 action: "Cancel / deselect" },
  { input: "F",                      action: "Flip card face (details panel)" },
];

const ControlsReference: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <div style={{
      width: "calc(100% - 40px)",
      margin: "0 20px 12px",
      background: "rgba(0,0,0,0.6)",
      border: "1px solid #333",
      borderRadius: 6,
      fontSize: 11,
      userSelect: "none",
    }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "5px 10px", cursor: "pointer", color: "#666",
        }}
      >
        <span style={{ letterSpacing: "0.05em" }}>CONTROLS</span>
        <span>{collapsed ? "▼" : "▲"}</span>
      </div>

      {!collapsed && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "2px 16px",
          padding: "6px 10px 10px",
          borderTop: "1px solid #2a2a2a",
        }}>
          {CONTROLS.map(({ input, action }) => (
            <div key={input} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "2px 0" }}>
              <span style={{
                color: "#888", whiteSpace: "nowrap", flexShrink: 0,
                fontFamily: "monospace", fontSize: 10,
                background: "#1a1a1a", border: "1px solid #333",
                borderRadius: 3, padding: "1px 5px",
              }}>
                {input}
              </span>
              <span style={{ color: "#555" }}>—</span>
              <span style={{ color: "#666" }}>{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};