import React from "react";
import { Card } from "../data/CardImporter";
import { Position } from "./ForceLayout";
import Draggable from "./draggable";
import { cardSize, canvasWidth, canvasHeight } from "./canvasUtils";

interface CardTokenProps {
  card: Card;
  pos: Position;
  isHighlighted: boolean;
  isSelected: boolean;
  isGroupDragging: boolean;
  glowColor?: string;       // set when a highlight-only label is hovered in legend
  passthroughPointer?: boolean; // when true, pointer events are disabled (ctrl mode)
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onPositionChange: (x: number, y: number) => void;
}

const CardToken: React.FC<CardTokenProps> = ({
  card,
  pos,
  isHighlighted,
  isSelected,
  isGroupDragging,
  glowColor,
  passthroughPointer,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onContextMenu,
  onMouseDown,
  onPositionChange,
}) => {
  if (!card.info || card.info.length === 0) return null;

  // Quantity label sits above the card, outside the bordered image div
  const quantityLabel = (
    <div style={{
      position: "absolute",
      top: -16,
      left: 0,
      color: "white",
      fontSize: 11,
      pointerEvents: "none",
    }}>
      {card.quantity}x
    </div>
  );

  const cardImage = (
    <img
      draggable="false"
      src={card.info[0].imageUrl}
      alt={card.cardname}
      width={cardSize.width}
      style={{ display: "block" }}
    />
  );

  // Build the inner card style based on current state
  const getInnerStyle = (base: React.CSSProperties): React.CSSProperties => {
    if (isSelected) {
      return {
        ...base,
        cursor: isGroupDragging ? "grabbing" : "grab",
        outline: "2px solid #88aaff",
        boxShadow: glowColor
          ? "0 0 8px #4466ff88, 0 0 12px " + glowColor
          : "0 0 8px #4466ff88",
      };
    }
    if (isHighlighted) {
      return { ...base, border: "2px solid yellow" };
    }
    if (glowColor) {
      return {
        ...base,
        outline: "2px solid " + glowColor,
        boxShadow: "0 0 10px " + glowColor,
      };
    }
    return base;
  };

  if (isSelected) {
    return (
      <div style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: cardSize.width,
        userSelect: "none",
        zIndex: 2,
        pointerEvents: passthroughPointer ? "none" : "auto",
      }}>
        {quantityLabel}
        <div
          style={getInnerStyle({})}
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onContextMenu={onContextMenu}
          onClick={onClick}
        >
          {cardImage}
        </div>
      </div>
    );
  }

  return (
    <Draggable
      containerWidth={canvasWidth}
      containerHeight={canvasHeight}
      initialX={pos.x}
      initialY={pos.y}
      onPositionChange={onPositionChange}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: cardSize.width,
        userSelect: "none",
        zIndex: 2,
        pointerEvents: passthroughPointer ? "none" : "auto",
      }}>
        {quantityLabel}
        <div
          style={getInnerStyle({})}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onContextMenu={onContextMenu}
        >
          {cardImage}
        </div>
      </div>
    </Draggable>
  );
};

export default CardToken;
