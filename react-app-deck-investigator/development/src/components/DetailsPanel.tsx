import React, { Component } from "react";
import { cardInfo } from "./CardImporter";

interface CardDescriptionProps {
  selectedCard: {
    info: cardInfo[];
    isSplit: boolean;
    isDFC: boolean;
    isFlip: boolean;
  } | null;
}

interface CardDescriptionState {
  showBack: boolean;
}

class CardDescription extends Component<CardDescriptionProps, CardDescriptionState> {
  constructor(props: CardDescriptionProps) {
    super(props);
    this.state = { showBack: false };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  componentDidUpdate(prevProps: CardDescriptionProps) {
    // Reset to front face if selected card changes
    if (prevProps.selectedCard !== this.props.selectedCard) {
      this.setState({ showBack: false });
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "f") {
      this.setState(prev => ({ showBack: !prev.showBack }));
    }
  };

  render() {
    const { selectedCard } = this.props;
    const { showBack } = this.state;

    if (!selectedCard || selectedCard.info.length === 0) return null;

    const { info, isFlip, isSplit } = selectedCard;
    const isDual = info.length > 1;

    const currentFace = showBack && isDual ? info[1] : info[0];
    const imageStyle: React.CSSProperties = {
      width: "266px",
      height: "370px",
      transform: isFlip && showBack ? "rotate(180deg)" : "none",
      transition: "transform 0.3s ease-in-out"
    };
    
    return (
      <div style={{ padding: "2px", width: "300px", height: "700px", overflowY: 'scroll' }}>
        <img src={currentFace.imageUrl} alt={currentFace.name} style={imageStyle} />
        <div>
          {isSplit ? (
            <>
              <h3>{info[0].name}</h3>
              <p>{info[0].text}</p>
              <h3>{info[1].name}</h3>
              <p>{info[1].text}</p>
            </>
          ) : (
            <>
            <h3>{currentFace.name}</h3>
            <p>{currentFace.text}</p>
            </>
          )}
        </div>
        
      </div>
    );
  }
}

export default CardDescription;
