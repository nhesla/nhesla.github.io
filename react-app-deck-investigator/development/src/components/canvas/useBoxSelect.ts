import { useState } from "react";
import { Card } from "../data/CardImporter";
import { Position } from "./ForceLayout";

const cardSize = { width: 40, height: 66 };

export interface SelectionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoxSelectState {
  selectedCards: Set<string>;
  selectionRect: SelectionRect | null;
  selectionStart: { x: number; y: number } | null;
  groupDragAnchor: { x: number; y: number } | null;
  groupDragBasePositions: Record<string, Position> | null;
}

export interface BoxSelectHandlers {
  handleCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSelectedCardMouseDown: (card: Card, e: React.MouseEvent) => void;
  setSelectedCards: (cards: Set<string>) => void;
}

export function useBoxSelect(
  cards: Card[] | null,
  positionMap: Record<string, Position>,
  onPositionsChange: (positions: Record<string, Position>) => void,
  canvasWidth: number,
  canvasHeight: number,
): [BoxSelectState, BoxSelectHandlers] {

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [groupDragAnchor, setGroupDragAnchor] = useState<{ x: number; y: number } | null>(null);
  const [groupDragBasePositions, setGroupDragBasePositions] = useState<Record<string, Position> | null>(null);

  const getPos = (card: Card): Position =>
    positionMap[card.cardname] ?? { x: card.x, y: card.y };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement) !== e.currentTarget) return;
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelectionStart({ x, y });
    setSelectionRect({ x, y, w: 0, h: 0 });
    if (!e.shiftKey) setSelectedCards(new Set());
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectionStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionRect({
        x: Math.min(x, selectionStart.x),
        y: Math.min(y, selectionStart.y),
        w: Math.abs(x - selectionStart.x),
        h: Math.abs(y - selectionStart.y),
      });
      return;
    }

    if (groupDragAnchor && groupDragBasePositions && selectedCards.size > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - groupDragAnchor.x;
      const dy = my - groupDragAnchor.y;
      const newPositions: Record<string, Position> = { ...positionMap };
      for (const name of selectedCards) {
        const base = groupDragBasePositions[name];
        if (!base) continue;
        newPositions[name] = {
          x: Math.max(0, Math.min(canvasWidth  - cardSize.width,  base.x + dx)),
          y: Math.max(0, Math.min(canvasHeight - cardSize.height, base.y + dy)),
        };
      }
      onPositionsChange(newPositions);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectionStart && selectionRect && cards) {
      const newSelected = new Set(e.shiftKey ? selectedCards : new Set<string>());
      for (const card of cards) {
        const pos = getPos(card);
        const cx = pos.x + cardSize.width  / 2;
        const cy = pos.y + cardSize.height / 2;
        if (
          cx >= selectionRect.x && cx <= selectionRect.x + selectionRect.w &&
          cy >= selectionRect.y && cy <= selectionRect.y + selectionRect.h
        ) {
          newSelected.add(card.cardname);
        }
      }
      setSelectedCards(newSelected);
    }
    setSelectionStart(null);
    setSelectionRect(null);
    setGroupDragAnchor(null);
    setGroupDragBasePositions(null);
  };

  const handleSelectedCardMouseDown = (_card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const rect = (e.currentTarget.closest("[data-canvas]") as HTMLElement)?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const base: Record<string, Position> = {};
    for (const name of selectedCards) {
      const c = cards?.find(c => c.cardname === name);
      if (c) base[name] = { ...getPos(c) };
    }
    setGroupDragAnchor({ x: mx, y: my });
    setGroupDragBasePositions(base);
  };

  const state: BoxSelectState = {
    selectedCards,
    selectionRect,
    selectionStart,
    groupDragAnchor,
    groupDragBasePositions,
  };

  const handlers: BoxSelectHandlers = {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleSelectedCardMouseDown,
    setSelectedCards,
  };

  return [state, handlers];
}