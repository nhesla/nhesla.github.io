import { Position } from "./ForceLayout";

export const cardSize = { width: 40, height: 66 };
export const canvasWidth  = 800;
export const canvasHeight = 700;
export const STRIPE_SPACING = 4;
export const LEGEND_MARGIN = 180;

export function getPos(
  card: { cardname: string; x: number; y: number },
  positionMap: Record<string, Position>,
): Position {
  return positionMap[card.cardname] ?? { x: card.x, y: card.y };
}

export function offsetLine(
  x1: number, y1: number, x2: number, y2: number,
  index: number, total: number,
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const offset = (index - (total - 1) / 2) * STRIPE_SPACING;
  return {
    x1: x1 + nx * offset, y1: y1 + ny * offset,
    x2: x2 + nx * offset, y2: y2 + ny * offset,
  };
}

export function shortenLine(
  x1: number, y1: number, x2: number, y2: number,
  t0: number, t1: number,
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  return {
    x1: x1 + ux * t0, y1: y1 + uy * t0,
    x2: x2 - ux * t1, y2: y2 - uy * t1,
  };
}

export function cardEdgePoint(
  fromCenter: { x: number; y: number },
  toCenter:   { x: number; y: number },
) {
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
