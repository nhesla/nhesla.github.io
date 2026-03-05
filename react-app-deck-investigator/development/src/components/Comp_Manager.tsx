import { Component } from "react";
import { Card } from "./CardImporter";
import Canvas from "./Canvas";
import Description_Panel from "./DetailsPanel";
import { detectSynergies, SynergyConnection } from "./SynergyEngine";

interface AppState {
  deck: Card[] | null;
  game: string;
  previewCard: Card | null;
  selectCard: Card | null;
  synergyConnections: SynergyConnection[];
}

class Comp_Manager extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      deck: null,
      game: "MTG",
      previewCard: null,
      selectCard: null,
      synergyConnections: [],
    };
  }

  updateDeck = (list: Card[], game: string) => {
    console.log("updateDeck called, game:", game, "cards:", list.length);
    const synergies = detectSynergies(list, game);
    this.setState({ deck: list, game, synergyConnections: synergies });
  };

  onClickCard = (card: Card) => {
    this.setState({ selectCard: card, previewCard: card });
  };

  onMouseOver = (card: Card) => {
    this.setState({ previewCard: card });
  };

  onMouseLeave = () => {
    if (this.state.selectCard != null) {
      this.setState({ previewCard: this.state.selectCard });
    }
  };

  render() {
    return (
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <Canvas
          cards={this.state.deck}
          synergyConnections={this.state.synergyConnections}
          onClickCard={this.onClickCard}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
        />
        <Description_Panel
          selectedCard={this.state.previewCard}
          onDeckUpdate={this.updateDeck}
        />
      </div>
    );
  }
}

export default Comp_Manager;
