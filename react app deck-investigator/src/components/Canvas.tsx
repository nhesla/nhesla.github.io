import { Component } from "react";
import { Card } from "./CardImporter";
import Draggable from "./helper_stuff/draggable";

interface CanvasProps {
  cards: Card[] | null;
  onClickCard: (card: Card) => void;
  onMouseOver: (card: Card) => void;
  onMouseLeave: () => void;
}

interface CanvasState {
  highlightedCard: Card | null;
  connections: { [key: string]: string[] };
  positionMap: { [cardname: string]: { x: number; y: number } };
}

const cardSize = { width: 40, height: 66 };
const canvasWidth = 800;
const canvasHeight = 700;

class Canvas extends Component<CanvasProps, CanvasState> {
  constructor(props: CanvasProps) {
    super(props);
    this.state = {
      highlightedCard: null,
      connections: {},
      positionMap: {},
    };
  }

  updateCardPosition = (cardname: string, x: number, y: number) => {
    this.setState((prev) => ({
      positionMap: {
        ...prev.positionMap,
        [cardname]: { x, y },
      },
    }));
  };

  handleRightClick = (card: Card, e: React.MouseEvent) => {
    e.preventDefault();
    this.setState({ highlightedCard: card });
  };

  handleLeftClick = (card: Card) => {
    const { highlightedCard, connections } = this.state;

    if (highlightedCard) {
      const highlightedName = highlightedCard.cardname;
      const clickedName = card.cardname;

      if (highlightedName === clickedName) return;

      const updatedConnections = { ...connections };
      if (!updatedConnections[highlightedName]) updatedConnections[highlightedName] = [];
      if (!updatedConnections[clickedName]) updatedConnections[clickedName] = [];

      if (!updatedConnections[highlightedName].includes(clickedName)) {
        updatedConnections[highlightedName].push(clickedName);
      }
      if (!updatedConnections[clickedName].includes(highlightedName)) {
        updatedConnections[clickedName].push(highlightedName);
      }

      this.setState({
        connections: updatedConnections,
        highlightedCard: null,
      });
    } else {
      this.setState({ highlightedCard: null });
    }
  };

  renderConnections = () => {
    const { cards } = this.props;
    const { connections, positionMap } = this.state;
    if (!cards) return null;

    return cards.flatMap((card) => {
      const cardName = card.cardname;
      const connectedNames = connections[cardName] || [];

      return connectedNames.map((connectedName) => {
        const connectedCard = cards.find((c) => c.cardname === connectedName);
        if (!connectedCard) return null;

        const posA = positionMap[card.cardname] || { x: card.x, y: card.y };
        const posB = positionMap[connectedCard.cardname] || { x: connectedCard.x, y: connectedCard.y };

        return (
          <line
            key={`${cardName}-${connectedName}`}
            x1={posA.x + cardSize.width / 2}
            y1={posA.y + cardSize.height / 2}
            x2={posB.x + cardSize.width / 2}
            y2={posB.y + cardSize.height / 2}
            stroke="cyan"
            strokeWidth="2"
          />
        );
      });
    });
  };

  render() {
    const { cards, onClickCard, onMouseOver, onMouseLeave } = this.props;
    const { highlightedCard } = this.state;

    return (
      <div
        style={{
          position: "relative",
          width: canvasWidth,
          height: canvasHeight,
          border: "1px solid white",
          margin: "20px",
        }}
        onClick={() => this.setState({ highlightedCard: null })}
      >
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 1,
            width: "100%",
            height: "100%",
          }}
        >
          {this.renderConnections()}
        </svg>

        {cards?.map((card, idx) => {
          if (!card.info || card.info.length === 0) return null;

          const isHighlighted = highlightedCard === card;

          return (
            <Draggable
              key={`${card.cardname}-${idx}`}
              containerWidth={canvasWidth}
              containerHeight={canvasHeight}
              initialX={card.x}
              initialY={card.y}
              onPositionChange={(x, y) => this.updateCardPosition(card.cardname, x, y)}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: cardSize.width,
                  height: cardSize.height,
                  opacity: 1,
                  userSelect: "none",
                  border: isHighlighted ? "2px solid yellow" : "none",
                }}
                onClick={() =>
                  highlightedCard ? this.handleLeftClick(card) : onClickCard(card)
                }
                onMouseOver={() => onMouseOver(card)}
                onMouseLeave={() => onMouseLeave()}
                onContextMenu={(e) => this.handleRightClick(card, e)}
              >
                <img
                  draggable="false"
                  src={card.info[0].imageUrl}
                  alt={card.cardname}
                  width={cardSize.width}
                />
                <div
                  style={{
                    position: "relative",
                    top: cardSize.height * -1 - 8,
                    left: cardSize.width / -2 - 10,
                    color: "white",
                  }}
                >
                  {card.quantity}x
                </div>
              </div>
            </Draggable>
          );
        })}
      </div>
    );
  }
}

export default Canvas;
