import { Component } from "react";
import Sidebar from "./helper_stuff/sidebar";
import Importer, {Card} from "./CardImporter";
import Canvas from "./Canvas";
import Description_Panel from "./DetailsPanel";


interface AppState {
  deck: Card[] | null;
  previewCard: Card | null;
  selectCard: Card | null;
}

class Comp_Manager extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      deck: null,
      previewCard: null,
      selectCard: null
    };
  }

  updateDeck = (list: Card[]) => {
    this.setState({ deck: list});
  };

  onClickCard = ( card: Card) => {
    this.setState({ selectCard: card});
    this.setState({ previewCard: card });
  };
  onMouseOver = ( card: Card) => {
    this.setState({ previewCard: card });
  };
  onMouseLeave = () => {
    if(this.state.selectCard != null){
      this.setState({ previewCard: this.state.selectCard});
    }
  };

  render() {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        
        
        <Canvas
          cards={this.state.deck}
          onClickCard={this.onClickCard}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
        />
        <Sidebar>
          <Importer onDeckUpdate={this.updateDeck}/>
        </Sidebar>
        
        <Description_Panel selectedCard={this.state.previewCard}/>
        
      </div>      
    );
  }
}

export default Comp_Manager;