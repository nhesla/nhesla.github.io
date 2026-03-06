import React, { Component } from "react";
import { cardInfo, Card } from "../data/CardImporter";
import { DeckSave } from "../data/SaveManager";
import CardImporter from "../data/CardImporter";

interface CardDescriptionProps {
  selectedCard: {
    info: cardInfo[];
    isSplit: boolean;
    isDFC: boolean;
    isFlip: boolean;
  } | null;
  onDeckUpdate: (deckList: Card[], game: string, rawText: string) => void;
  saves: DeckSave[];
  currentDecklistText: string;
  onSave: (name: string) => void;
  onLoad: (save: DeckSave) => void;
  onDelete: (name: string) => void;
  onExportSingle: (save: DeckSave) => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
}

interface CardDescriptionState {
  showBack: boolean;
  importerOpen: boolean;
}

class CardDescription extends Component<CardDescriptionProps, CardDescriptionState> {
  constructor(props: CardDescriptionProps) {
    super(props);
    this.state = { showBack: false, importerOpen: false };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  componentDidUpdate(prevProps: CardDescriptionProps) {
    if (prevProps.selectedCard !== this.props.selectedCard) {
      this.setState({ showBack: false });
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "f") {
      this.setState(prev => ({ showBack: !prev.showBack }));
    }
  };

  handleDeckUpdate = (deckList: Card[], game: string, rawText: string) => {
    this.props.onDeckUpdate(deckList, game, rawText);
    this.setState({ importerOpen: false });
  };

  render() {
    const { selectedCard } = this.props;
    const { showBack, importerOpen } = this.state;

    const isDual = selectedCard ? selectedCard.info.length > 1 : false;
    const currentFace = selectedCard
      ? (showBack && isDual ? selectedCard.info[1] : selectedCard.info[0])
      : null;

    const imageStyle: React.CSSProperties = {
      width: "266px",
      height: "370px",
      transform: selectedCard?.isFlip && showBack ? "rotate(180deg)" : "none",
      transition: "transform 0.3s ease-in-out",
    };

    return (
      <div style={{ position: "relative", width: "300px", flexShrink: 0 }}>

        {/* ── Import tab ── */}
        <div
          onClick={() => this.setState({ importerOpen: !importerOpen })}
          style={{
            background: "#44444488",
            color: "white",
            textAlign: "center",
            padding: "6px 0",
            cursor: "pointer",
            userSelect: "none",
            fontSize: "13px",
            borderBottom: "1px solid #666",
          }}
        >
          {importerOpen ? "▲ Close Import" : "▼ Import Deck"}
        </div>

        {/* ── Importer drawer ── */}
        {importerOpen && (
          <div style={{
            position: "absolute",
            top: "31px",
            left: 0,
            right: 0,
            background: "#222222ee",
            zIndex: 9,
            backdropFilter: "blur(4px)",
            borderBottom: "1px solid #555",
          }}>
            <CardImporter
              onDeckUpdate={this.handleDeckUpdate}
              saves={this.props.saves}
              currentDecklistText={this.props.currentDecklistText}
              onSave={this.props.onSave}
              onLoad={(save) => { this.props.onLoad(save); this.setState({ importerOpen: false }); }}
              onDelete={this.props.onDelete}
              onExportSingle={this.props.onExportSingle}
              onExportAll={this.props.onExportAll}
              onImport={this.props.onImport}
            />
          </div>
        )}

        {/* ── Card details ── */}
        <div style={{ padding: "2px", height: "700px", overflowY: "scroll" }}>
          {selectedCard && currentFace ? (
            <>
              <img src={currentFace.imageUrl} alt={currentFace.name} style={imageStyle} />
              <div>
                {selectedCard.isSplit ? (
                  <>
                    <h3>{selectedCard.info[0].name}</h3>
                    <p>{selectedCard.info[0].text}</p>
                    <h3>{selectedCard.info[1].name}</h3>
                    <p>{selectedCard.info[1].text}</p>
                  </>
                ) : (
                  <>
                    <h3>{currentFace.name}</h3>
                    <p>{currentFace.text}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: "#888", padding: "20px", fontSize: "13px" }}>
              Hover or click a card to see details.
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default CardDescription;