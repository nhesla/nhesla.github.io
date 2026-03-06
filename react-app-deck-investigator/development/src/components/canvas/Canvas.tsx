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

interface CanvasProps {
  cards: Card[] | null;
  synergyConnections: SynergyConnection[];
  positionMap: Record<string, Position>;
  manualConnections: ManualConnection[];
  onPositionMapChange: (map: Record<string, Position>) => void;
  onManualConnectionsChange: (conns: ManualConnection[]) => void;
  onClickCard: (card: Card) => void;
  onMouseOver: (card: Card) => void;
  onMouseLeave: () => void;
}

type PendingConnection =
  | { mode: "single";           from: string; to: string }
  | { mode: "multi";            from: string; targets: string[] }
  | { mode: "group";            targets: string[] }
  | { mode: "edit-label";       label: string }
  | { mode: "edit-connection";  connection: ManualConnection };

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
        setPendingConnection(null);
        setHighlightedCard(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        setCtrlMode(false);
        setSelectedLineId(null);
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

      case "edit-connection":
        return { ...base, mode: "edit-connection" as ConnectionModalMode,
          editingConnection: pendingConnection.connection,
          onDelete: handleModalDelete };
    }
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
        {ctrlMode && (
          <span style={{ color: "#88aaff", fontSize: "11px" }}>
            Ctrl: click a line to edit it
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
        />

        {modalProps && <ConnectionModal {...modalProps} />}
      </div>
    </div>
  );
};

export default Canvas;