import React, { Component } from "react";
import { cardInfo, Card } from "../data/CardImporter";
import { DeckSave } from "../data/SaveManager";
import CardImporter from "../data/CardImporter";

interface CardDescriptionProps {
  selectedCard: {
    cardname: string;
    info: cardInfo[];
    isSplit: boolean;
    isDFC: boolean;
    isFlip: boolean;
  } | null;
  onDeckUpdate: (deckList: Card[], game: string, rawText: string) => void;
  game: string;
  disabledCards: Set<string>;
  onToggleDisabled: (cardname: string) => void;
  printingOverrides: Record<string, string>;
  onChangePrinting: (cardname: string, imageUrl: string) => void;
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
  printingsOpen: boolean;
  printings: { imageUrl: string; setName: string; setCode: string; collectorNumber: string }[];
  printingsLoading: boolean;
}

class CardDescription extends Component<CardDescriptionProps, CardDescriptionState> {
  constructor(props: CardDescriptionProps) {
    super(props);
    this.state = { showBack: false, importerOpen: false, printingsOpen: false, printings: [], printingsLoading: false };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  componentDidUpdate(prevProps: CardDescriptionProps) {
    if (prevProps.selectedCard !== this.props.selectedCard) {
      this.setState({ showBack: false, printingsOpen: false, printings: [] });
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "f") {
      this.setState(prev => ({ showBack: !prev.showBack }));
    }
  };

  fetchPrintings = async (cardname: string) => {
    this.setState({ printingsLoading: true, printings: [], printingsOpen: true });
    try {
      const baseName = cardname.split(" // ")[0];
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(baseName)}"&unique=prints&order=released`
      );
      const data = await res.json();
      const prints = (data.data ?? []).map((c: any) => ({
        imageUrl: c.card_faces?.[0]?.image_uris?.normal || c.image_uris?.normal || "",
        setName: c.set_name,
        setCode: c.set,
        collectorNumber: c.collector_number,
      })).filter((p: any) => p.imageUrl);
      this.setState({ printings: prints, printingsLoading: false });
    } catch {
      this.setState({ printingsLoading: false });
    }
  };

  handleDeckUpdate = (deckList: Card[], game: string, rawText: string) => {
    this.props.onDeckUpdate(deckList, game, rawText);
    this.setState({ importerOpen: false });
  };

  render() {
    const { selectedCard, disabledCards, onToggleDisabled, printingOverrides, onChangePrinting, game } = this.props;
    const { showBack, importerOpen, printingsOpen, printings, printingsLoading } = this.state;

    const isDual = selectedCard ? selectedCard.info.length > 1 : false;
    const currentFace = selectedCard
      ? (showBack && isDual ? selectedCard.info[1] : selectedCard.info[0])
      : null;

    const displayImageUrl = currentFace
      ? (!showBack && printingOverrides[selectedCard?.cardname ?? ""])
        || currentFace.imageUrl
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
              <img src={displayImageUrl ?? ""} alt={currentFace.name} style={imageStyle} />
              {game === "MTG" && (
                <button
                  onClick={() => {
                    if (printingsOpen) {
                      this.setState({ printingsOpen: false });
                    } else {
                      this.fetchPrintings(selectedCard.cardname);
                    }
                  }}
                  style={{
                    width: "100%", marginTop: 6, padding: "5px 0",
                    background: "none", border: "1px solid #445",
                    borderRadius: 4, color: "#888",
                    cursor: "pointer", fontSize: 11,
                  }}
                >
                  {printingsOpen ? "▲ Close Printings" : "▼ Change Printing"}
                </button>
              )}

              {printingsOpen && (
                <div style={{
                  marginTop: 6, maxHeight: 220, overflowY: "auto",
                  border: "1px solid #333", borderRadius: 4, padding: 6,
                  background: "#111",
                }}>
                  {printingsLoading && (
                    <div style={{ color: "#555", fontSize: 11, padding: 8, textAlign: "center" }}>
                      Loading printings...
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {printings.map((p: any) => {
                      const isActive = (printingOverrides[selectedCard.cardname] ?? currentFace?.imageUrl) === p.imageUrl;
                      return (
                        <div
                          key={p.setCode + p.collectorNumber}
                          onClick={() => onChangePrinting(selectedCard.cardname, p.imageUrl)}
                          title={`${p.setName} #${p.collectorNumber}`}
                          style={{
                            cursor: "pointer",
                            border: isActive ? "2px solid #88aaff" : "2px solid transparent",
                            borderRadius: 3, flexShrink: 0,
                          }}
                        >
                          <img
                            src={p.imageUrl} alt={p.setName}
                            style={{ width: 56, display: "block", borderRadius: 2 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                  onClick={() => onToggleDisabled(selectedCard.cardname)}
                  style={{
                    width: "100%", marginTop: 6, padding: "5px 0",
                    background: "none",
                    border: disabledCards.has(selectedCard.cardname)
                      ? "1px solid #88aaff" : "1px solid #445",
                    borderRadius: 4,
                    color: disabledCards.has(selectedCard.cardname)
                      ? "#88aaff" : "#888",
                    cursor: "pointer", fontSize: 11,
                  }}
                >
                  {disabledCards.has(selectedCard.cardname)
                    ? "⬤ Connections enabled" : "○ Disable connections"}
                </button>
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