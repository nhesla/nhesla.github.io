import React, { Component } from "react";
import { Card } from "./CardImporter";
import Draggable from "./helper_stuff/draggable";
import { SynergyConnection, SynergyDirection, SynergyCategory, SYNERGY_COLORS, CATEGORY_LABELS } from "./SynergyEngine";
import { runForceLayout, Position } from "./ForceLayout";

interface CanvasProps {
  cards: Card[] | null;
  synergyConnections: SynergyConnection[];
  onClickCard: (card: Card) => void;
  onMouseOver: (card: Card) => void;
  onMouseLeave: () => void;
}

interface CanvasState {
  highlightedCard: Card | null;
  connections: { [key: string]: string[] };
  positionMap: { [cardname: string]: Position };
  hiddenLabels: Set<string>;
  legendHoveredLabel: string | null;
  legendCollapsed: boolean;
  isHoveringCard: boolean;
  hoveredCard: string | null;
  selectedCards: Set<string>;
  selectionRect: { x: number; y: number; w: number; h: number } | null;
  selectionStart: { x: number; y: number } | null;
  groupDragAnchor: { x: number; y: number } | null;
  groupDragBasePositions: Record<string, Position> | null;
}

const cardSize = { width: 40, height: 66 };
const canvasWidth  = 800;
const canvasHeight = 700;
const STRIPE_SPACING = 4;

export const LEGEND_MARGIN = 180;

function markerId(category: string, direction: "start" | "end") {
  return `arrow-${category}-${direction}`;
}

class Canvas extends Component<CanvasProps, CanvasState> {
  constructor(props: CanvasProps) {
    super(props);
    this.state = {
      highlightedCard: null,
      connections: {},
      positionMap: {},
      hiddenLabels: new Set(),
      legendHoveredLabel: null,
      legendCollapsed: false,
      isHoveringCard: false,
      hoveredCard: null,
      selectedCards: new Set(),
      selectionRect: null,
      selectionStart: null,
      groupDragAnchor: null,
      groupDragBasePositions: null,
    };
  }

  componentDidUpdate(prevProps: CanvasProps) {
    if (prevProps.cards !== this.props.cards && this.props.cards) {
      this.runLayout();
    }
  }

  runLayout = () => {
    const { cards, synergyConnections } = this.props;
    if (!cards) return;
    const positions = runForceLayout(cards, synergyConnections, LEGEND_MARGIN);
    this.setState({ positionMap: positions });
  };

  updateCardPosition = (cardname: string, x: number, y: number) => {
    this.setState(prev => ({
      positionMap: { ...prev.positionMap, [cardname]: { x, y } },
    }));
  };

  handleRightClick = (card: Card, e: React.MouseEvent) => {
    e.preventDefault();
    this.setState({ highlightedCard: card });
  };

  handleLeftClick = (card: Card) => {
    const { highlightedCard, connections } = this.state;
    if (!highlightedCard) { this.setState({ highlightedCard: null }); return; }
    const a = highlightedCard.cardname, b = card.cardname;
    if (a === b) return;
    const updated = { ...connections };
    if (!updated[a]) updated[a] = [];
    if (!updated[b]) updated[b] = [];
    if (!updated[a].includes(b)) updated[a].push(b);
    if (!updated[b].includes(a)) updated[b].push(a);
    this.setState({ connections: updated, highlightedCard: null });
  };

  getPos(card: Card): Position {
    return this.state.positionMap[card.cardname] ?? { x: card.x, y: card.y };
  }

  offsetLine(x1: number, y1: number, x2: number, y2: number, index: number, total: number) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const offset = (index - (total - 1) / 2) * STRIPE_SPACING;
    return { x1: x1 + nx * offset, y1: y1 + ny * offset,
             x2: x2 + nx * offset, y2: y2 + ny * offset };
  }

  shortenLine(x1: number, y1: number, x2: number, y2: number, t0: number, t1: number) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    return { x1: x1 + ux * t0, y1: y1 + uy * t0,
             x2: x2 - ux * t1, y2: y2 - uy * t1 };
  }

  cardEdgePoint(fromCenter: {x: number, y: number}, toCenter: {x: number, y: number}) {
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const hw = cardSize.width  / 2 + 3;
    const hh = cardSize.height / 2 + 3;
    const tEdge = Math.min(
      ux !== 0 ? Math.abs(hw / ux) : Infinity,
      uy !== 0 ? Math.abs(hh / uy) : Infinity,
    );
    return { x: fromCenter.x + ux * tEdge, y: fromCenter.y + uy * tEdge };
  }

  // ── Box select ──────────────────────────────────────────────────────────────

  handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement) !== e.currentTarget) return;
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.setState({
      selectionStart: { x, y },
      selectionRect: { x, y, w: 0, h: 0 },
      selectedCards: e.shiftKey ? this.state.selectedCards : new Set(),
      highlightedCard: null,
    });
  };

  handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { selectionStart, groupDragAnchor, groupDragBasePositions, selectedCards } = this.state;

    if (selectionStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.setState({ selectionRect: {
        x: Math.min(x, selectionStart.x), y: Math.min(y, selectionStart.y),
        w: Math.abs(x - selectionStart.x),  h: Math.abs(y - selectionStart.y),
      }});
      return;
    }

    if (groupDragAnchor && groupDragBasePositions && selectedCards.size > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - groupDragAnchor.x;
      const dy = my - groupDragAnchor.y;
      const newPositions: Record<string, Position> = { ...this.state.positionMap };
      for (const name of selectedCards) {
        const base = groupDragBasePositions[name];
        if (!base) continue;
        newPositions[name] = {
          x: Math.max(0, Math.min(canvasWidth  - cardSize.width,  base.x + dx)),
          y: Math.max(0, Math.min(canvasHeight - cardSize.height, base.y + dy)),
        };
      }
      this.setState({ positionMap: newPositions });
    }
  };

  handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const { selectionStart, selectionRect, selectedCards } = this.state;

    if (selectionStart && selectionRect) {
      const { cards } = this.props;
      if (cards) {
        const newSelected = new Set(e.shiftKey ? selectedCards : new Set<string>());
        for (const card of cards) {
          const pos = this.getPos(card);
          const cx = pos.x + cardSize.width  / 2;
          const cy = pos.y + cardSize.height / 2;
          if (cx >= selectionRect.x && cx <= selectionRect.x + selectionRect.w &&
              cy >= selectionRect.y && cy <= selectionRect.y + selectionRect.h) {
            newSelected.add(card.cardname);
          }
        }
        this.setState({ selectedCards: newSelected });
      }
    }

    this.setState({ selectionStart: null, selectionRect: null,
                    groupDragAnchor: null, groupDragBasePositions: null });
  };

  handleSelectedCardMouseDown = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const rect = (e.currentTarget.closest('[data-canvas]') as HTMLElement)?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const base: Record<string, Position> = {};
    for (const name of this.state.selectedCards) {
      const c = this.props.cards?.find(c => c.cardname === name);
      if (c) base[name] = { ...this.getPos(c) };
    }
    this.setState({ groupDragAnchor: { x: mx, y: my }, groupDragBasePositions: base });
  };

  // ── Highlight logic ─────────────────────────────────────────────────────────

  getActiveHighlight(): { mode: "card"; cardName: string } | { mode: "label"; label: string } | null {
    const { hoveredCard, legendHoveredLabel, highlightedCard } = this.state;
    if (highlightedCard) return null;
    if (hoveredCard) return { mode: "card", cardName: hoveredCard };
    if (legendHoveredLabel) return { mode: "label", label: legendHoveredLabel };
    return null;
  }

  isPairHighlighted(conns: SynergyConnection[], nameA: string, nameB: string): boolean {
    const active = this.getActiveHighlight();
    if (!active) return false;
    if (active.mode === "card") return nameA === active.cardName || nameB === active.cardName;
    return conns.some(c => c.label === active.label);
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  renderSelectionRect() {
    const { selectionRect } = this.state;
    if (!selectionRect || (selectionRect.w < 2 && selectionRect.h < 2)) return null;
    return (
      <rect x={selectionRect.x} y={selectionRect.y}
        width={selectionRect.w} height={selectionRect.h}
        fill="rgba(100,150,255,0.08)" stroke="#88aaff"
        strokeWidth="1" strokeDasharray="4 3"
        style={{ pointerEvents: "none" }} />
    );
  }

  renderDefs() {
    const categories = Object.keys(SYNERGY_COLORS) as SynergyCategory[];
    return (
      <defs>
        {categories.flatMap(cat => {
          const color = SYNERGY_COLORS[cat];
          return [
            <marker key={`${cat}-end`} id={markerId(cat, "end")}
              markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={color} opacity="0.9" />
            </marker>,
            <marker key={`${cat}-start`} id={markerId(cat, "start")}
              markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse">
              <path d="M0,0 L0,6 L6,3 z" fill={color} opacity="0.9" />
            </marker>,
          ];
        })}
      </defs>
    );
  }

  renderManualConnections() {
    const { cards } = this.props;
    const { connections } = this.state;
    if (!cards) return null;
    const rendered = new Set<string>();
    return cards.flatMap(card =>
      (connections[card.cardname] || []).map(connectedName => {
        const pairKey = [card.cardname, connectedName].sort().join("|");
        if (rendered.has(pairKey)) return null;
        rendered.add(pairKey);
        const other = cards.find(c => c.cardname === connectedName);
        if (!other) return null;
        const posA = this.getPos(card), posB = this.getPos(other);
        const cA = { x: posA.x + cardSize.width / 2, y: posA.y + cardSize.height / 2 };
        const cB = { x: posB.x + cardSize.width / 2, y: posB.y + cardSize.height / 2 };
        const eA = this.cardEdgePoint(cA, cB);
        const eB = this.cardEdgePoint(cB, cA);
        return (
          <line key={`manual-${pairKey}`}
            x1={eA.x} y1={eA.y} x2={eB.x} y2={eB.y}
            stroke="cyan" strokeWidth="2" style={{ pointerEvents: "none" }} />
        );
      })
    );
  }

  buildPairMap() {
    const { synergyConnections } = this.props;
    const { hiddenLabels } = this.state;
    const pairMap = new Map<string, SynergyConnection[]>();
    for (const conn of synergyConnections) {
      if (hiddenLabels.has(conn.label)) continue;
      const key = [conn.from, conn.to].sort().join("|");
      if (!pairMap.has(key)) pairMap.set(key, []);
      pairMap.get(key)!.push(conn);
    }
    return pairMap;
  }

  buildStripes(
    pairKey: string, conns: SynergyConnection[],
    ex1: number, ey1: number, ex2: number, ey2: number,
    isHighlighted: boolean, isDimmed: boolean,
  ): React.ReactElement[] {
    const [nameA] = pairKey.split("|");
    const total = conns.length;
    const direction: SynergyDirection = conns[0].direction;
    const isFlipped = conns[0].from !== nameA;

    return conns.map((conn, i) => {
      const base = total > 1
        ? this.offsetLine(ex1, ey1, ex2, ey2, i, total)
        : { x1: ex1, y1: ey1, x2: ex2, y2: ey2 };
      const TRIM = direction === "none" ? 0 : 8;
      const { x1, y1, x2, y2 } = this.shortenLine(base.x1, base.y1, base.x2, base.y2, TRIM, TRIM);

      let markerStart: string | undefined;
      let markerEnd:   string | undefined;
      if (direction === "forward") {
        if (!isFlipped) markerEnd   = `url(#${markerId(conn.category, "end")})`;
        else            markerStart = `url(#${markerId(conn.category, "start")})`;
      } else if (direction === "bidirectional") {
        markerStart = `url(#${markerId(conn.category, "start")})`;
        markerEnd   = `url(#${markerId(conn.category, "end")})`;
      }

      return (
        <line key={`stripe-${pairKey}-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={SYNERGY_COLORS[conn.category]}
          strokeWidth={isHighlighted ? 3 : 1.5}
          strokeDasharray={direction === "none" ? "none" : "6 4"}
          opacity={isDimmed ? 0.1 : isHighlighted ? 1 : 0.6}
          markerEnd={markerEnd} markerStart={markerStart}
          style={{ pointerEvents: "none" }} />
      );
    });
  }

  renderNormalLines() {
    const { cards } = this.props;
    if (!cards) return null;
    const active = this.getActiveHighlight();
    const pairMap = this.buildPairMap();
    const els: React.ReactElement[] = [];

    for (const [pairKey, conns] of pairMap.entries()) {
      const [nameA, nameB] = pairKey.split("|");
      const cardA = cards.find(c => c.cardname === nameA);
      const cardB = cards.find(c => c.cardname === nameB);
      if (!cardA || !cardB) continue;
      const posA = this.getPos(cardA), posB = this.getPos(cardB);
      const cA = { x: posA.x + cardSize.width / 2, y: posA.y + cardSize.height / 2 };
      const cB = { x: posB.x + cardSize.width / 2, y: posB.y + cardSize.height / 2 };
      const eA = this.cardEdgePoint(cA, cB);
      const eB = this.cardEdgePoint(cB, cA);
      if (this.isPairHighlighted(conns, nameA, nameB)) continue;
      const isDimmed = active !== null;
      els.push(<g key={`lines-${pairKey}`}>{this.buildStripes(pairKey, conns, eA.x, eA.y, eB.x, eB.y, false, isDimmed)}</g>);
    }
    return els;
  }

  renderHighlightedLines() {
    const { cards } = this.props;
    if (!cards) return null;
    const active = this.getActiveHighlight();
    if (!active) return null;
    const pairMap = this.buildPairMap();
    const els: React.ReactElement[] = [];
    const mids: Array<{ x: number; y: number }> = [];

    for (const [pairKey, conns] of pairMap.entries()) {
      const [nameA, nameB] = pairKey.split("|");
      if (!this.isPairHighlighted(conns, nameA, nameB)) continue;
      const cardA = cards.find(c => c.cardname === nameA);
      const cardB = cards.find(c => c.cardname === nameB);
      if (!cardA || !cardB) continue;
      const posA = this.getPos(cardA), posB = this.getPos(cardB);
      const cA = { x: posA.x + cardSize.width / 2, y: posA.y + cardSize.height / 2 };
      const cB = { x: posB.x + cardSize.width / 2, y: posB.y + cardSize.height / 2 };
      const eA = this.cardEdgePoint(cA, cB);
      const eB = this.cardEdgePoint(cB, cA);
      mids.push({ x: (cA.x + cB.x) / 2, y: (cA.y + cB.y) / 2 });
      els.push(<g key={`hl-${pairKey}`}>{this.buildStripes(pairKey, conns, eA.x, eA.y, eB.x, eB.y, true, false)}</g>);
    }

    if (active.mode === "label" && mids.length > 0) {
      const avgX = mids.reduce((s, p) => s + p.x, 0) / mids.length;
      const avgY = mids.reduce((s, p) => s + p.y, 0) / mids.length;
      els.push(
        <text key="label" x={avgX} y={avgY - 8}
          fill="white" fontSize="11" textAnchor="middle"
          style={{ pointerEvents: "none", filter: "drop-shadow(0px 0px 4px black)" }}>
          {active.label}
        </text>
      );
    }
    return els;
  }



  renderLegend() {
    const { synergyConnections } = this.props;
    const { hiddenLabels, legendHoveredLabel, legendCollapsed } = this.state;
    if (!synergyConnections.length) return null;

    const seen = new Map<string, SynergyCategory>();
    for (const conn of synergyConnections) {
      if (!seen.has(conn.label)) seen.set(conn.label, conn.category);
    }
    const entries = Array.from(seen.entries());

    return (
      <div style={{
        position: "absolute", top: 10, left: 10,
        background: "rgba(0,0,0,0.80)", border: "1px solid #444",
        borderRadius: "6px", zIndex: 10, userSelect: "none",
        minWidth: legendCollapsed ? "auto" : "165px",
        maxHeight: legendCollapsed ? "auto" : "80%",
        overflow: "hidden",
      }}>
        <div
          onClick={() => this.setState(p => ({ legendCollapsed: !p.legendCollapsed }))}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 10px", cursor: "pointer",
            borderBottom: legendCollapsed ? "none" : "1px solid #333",
          }}
        >
          <span style={{ color: "#aaa", fontSize: "10px", letterSpacing: "0.05em" }}>CONNECTIONS</span>
          <span style={{ color: "#666", fontSize: "10px", marginLeft: 8 }}>
            {legendCollapsed ? "▼" : "▲"}
          </span>
        </div>

        {!legendCollapsed && (
          <div style={{ padding: "6px 10px 8px", overflowY: "auto", maxHeight: "60vh" }}>
            {entries.map(([label, category]) => {
              const hidden  = hiddenLabels.has(label);
              const hovered = legendHoveredLabel === label;
              return (
                <div key={label}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    marginBottom: "4px", opacity: hidden ? 0.3 : 1, cursor: "pointer",
                  }}
                  onMouseEnter={() => {
                    if (!hidden && !this.state.isHoveringCard && !this.state.highlightedCard)
                      this.setState({ legendHoveredLabel: label });
                  }}
                  onMouseLeave={() => this.setState({ legendHoveredLabel: null })}
                >
                  <div style={{
                    width: 20, height: 3, flexShrink: 0,
                    background: SYNERGY_COLORS[category], borderRadius: 2,
                    boxShadow: hovered ? `0 0 6px ${SYNERGY_COLORS[category]}` : "none",
                  }} />
                  <span style={{ color: hovered ? "white" : "#ccc", fontSize: "10px", flex: 1, lineHeight: 1.3 }}>
                    {label}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      this.setState(prev => {
                        const next = new Set(prev.hiddenLabels);
                        next.has(label) ? next.delete(label) : next.add(label);
                        return { hiddenLabels: next, legendHoveredLabel: null };
                      });
                    }}
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
            })}
          </div>
        )}
      </div>
    );
  }

  render() {
    const { cards, onClickCard, onMouseOver, onMouseLeave } = this.props;
    const { highlightedCard } = this.state;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <button onClick={this.runLayout} style={{
          margin: "4px 20px", padding: "4px 12px",
          background: "#334", color: "white",
          border: "1px solid #558", cursor: "pointer",
          fontSize: "12px", alignSelf: "flex-start",
        }}>
          ↺ Re-layout
        </button>

        <div
          data-canvas
          style={{
            position: "relative", width: canvasWidth, height: canvasHeight,
            border: "1px solid white", margin: "0 20px 20px 20px", flexShrink: 0,
            userSelect: "none",
          }}
          onClick={(e) => { if ((e.target as HTMLElement) === e.currentTarget) this.setState({ highlightedCard: null }); }}
          onMouseDown={this.handleCanvasMouseDown}
          onMouseMove={this.handleCanvasMouseMove}
          onMouseUp={this.handleCanvasMouseUp}
          onMouseLeave={this.handleCanvasMouseUp}
        >
          {/* Bottom SVG: normal/dimmed lines */}
          <svg style={{
            position: "absolute", top: 0, left: 0, zIndex: 1,
            width: "100%", height: "100%", overflow: "visible",
            pointerEvents: "none",
          }}>
            {this.renderDefs()}
            {this.renderNormalLines()}
            {this.renderManualConnections()}
            {this.renderSelectionRect()}
          </svg>

          {/* Top SVG: highlighted lines + label, above cards */}
          <svg style={{
            position: "absolute", top: 0, left: 0, zIndex: 4,
            width: "100%", height: "100%", overflow: "visible",
            pointerEvents: "none",
          }}>
            {this.renderHighlightedLines()}
          </svg>

          {/* Cards */}
          {cards?.map((card, idx) => {
            if (!card.info || card.info.length === 0) return null;
            const isHighlighted = highlightedCard === card;
            const isSelected = this.state.selectedCards.has(card.cardname);
            const isGroupDragging = !!this.state.groupDragAnchor;
            const pos = this.getPos(card);

            const cardMouseEnter = () => {
              this.setState({ isHoveringCard: true, hoveredCard: card.cardname });
              onMouseOver(card);
            };
            const cardMouseLeave = () => {
              this.setState({ isHoveringCard: false, hoveredCard: null });
              onMouseLeave();
            };
            const cardClick = (e: React.MouseEvent) => {
              if (e.shiftKey) {
                this.setState(prev => {
                  const next = new Set(prev.selectedCards);
                  next.has(card.cardname) ? next.delete(card.cardname) : next.add(card.cardname);
                  return { selectedCards: next };
                });
              } else if (highlightedCard) {
                this.handleLeftClick(card);
              } else {
                onClickCard(card);
              }
            };

            if (isSelected) {
              return (
                <div key={`${card.cardname}-${idx}`}
                  style={{
                    position: "absolute", left: pos.x, top: pos.y,
                    width: cardSize.width, height: cardSize.height,
                    userSelect: "none", zIndex: 2,
                    cursor: isGroupDragging ? "grabbing" : "grab",
                    outline: "2px solid #88aaff",
                    boxShadow: "0 0 8px #4466ff88",
                  }}
                  onMouseDown={e => this.handleSelectedCardMouseDown(card, e)}
                  onMouseEnter={cardMouseEnter}
                  onMouseLeave={cardMouseLeave}
                  onContextMenu={e => this.handleRightClick(card, e)}
                  onClick={cardClick}
                >
                  <img draggable="false" src={card.info[0].imageUrl}
                    alt={card.cardname} width={cardSize.width} />
                  <div style={{
                    position: "relative",
                    top: cardSize.height * -1 - 8, left: cardSize.width / -2 - 10,
                    color: "white",
                  }}>{card.quantity}x</div>
                </div>
              );
            }

            return (
              <Draggable key={`${card.cardname}-${idx}`}
                containerWidth={canvasWidth} containerHeight={canvasHeight}
                initialX={pos.x} initialY={pos.y}
                onPositionChange={(x, y) => this.updateCardPosition(card.cardname, x, y)}
              >
                <div style={{
                  position: "absolute", top: 0, left: 0,
                  width: cardSize.width, height: cardSize.height,
                  userSelect: "none", zIndex: 2,
                  border: isHighlighted ? "2px solid yellow" : "none",
                }}
                  onClick={cardClick}
                  onMouseEnter={cardMouseEnter}
                  onMouseLeave={cardMouseLeave}
                  onContextMenu={e => this.handleRightClick(card, e)}
                >
                  <img draggable="false" src={card.info[0].imageUrl}
                    alt={card.cardname} width={cardSize.width} />
                  <div style={{
                    position: "relative",
                    top: cardSize.height * -1 - 8, left: cardSize.width / -2 - 10,
                    color: "white",
                  }}>{card.quantity}x</div>
                </div>
              </Draggable>
            );
          })}

          {/* Legend */}
          {this.renderLegend()}
        </div>
      </div>
    );
  }
}

export default Canvas;
