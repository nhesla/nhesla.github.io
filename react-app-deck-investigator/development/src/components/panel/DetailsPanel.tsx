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
  onRemoveCard: (cardname: string) => void;
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
  colorWarning: string | null;
  onDismissColorWarning: () => void;
  // Add card
  addCardName: string;
  addCardLoading: boolean;
  addCardError: string | null;
  onAddCardNameChange: (name: string) => void;
  onAddCard: () => void;
}

interface CardDescriptionState {
  showBack: boolean;
  importerOpen: boolean;
  printingsOpen: boolean;
  printings: { imageUrl: string; setName: string; setCode: string; collectorNumber: string }[];
  printingsLoading: boolean;
  confirmRemove: boolean;
}

class CardDescription extends Component<CardDescriptionProps, CardDescriptionState> {
  constructor(props: CardDescriptionProps) {
    super(props);
    this.state = {
      showBack: false, importerOpen: false,
      printingsOpen: false, printings: [], printingsLoading: false,
      confirmRemove: false,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  componentDidUpdate(prevProps: CardDescriptionProps) {
    if (prevProps.selectedCard !== this.props.selectedCard) {
      this.setState({ showBack: false, printingsOpen: false, printings: [], confirmRemove: false });
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "f") {
      this.setState(prev => ({ showBack: !prev.showBack }));
    }
    if (e.key === "Escape") {
      this.setState({ confirmRemove: false });
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
    const {
      selectedCard, disabledCards, onToggleDisabled, onRemoveCard,
      printingOverrides, onChangePrinting, game,
      addCardName, addCardLoading, addCardError, onAddCardNameChange, onAddCard,
      colorWarning, onDismissColorWarning,
      currentDecklistText,
    } = this.props;
    const { showBack, importerOpen, printingsOpen, printings, printingsLoading, confirmRemove } = this.state;

    const hasDeck = !!currentDecklistText;
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

    const btnBase: React.CSSProperties = {
      width: "100%", marginTop: 6, padding: "5px 0",
      background: "none", borderRadius: 4,
      cursor: "pointer", fontSize: 11,
    };

    return (
      <div style={{ position: "relative", width: "300px", flexShrink: 0 }}>

        {/* ── Color warning banner ── */}
        {colorWarning && (
          <div style={{
            background: "#2a1500", border: "1px solid #a06020",
            borderRadius: 4, padding: "7px 10px", margin: "6px 2px 0",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ color: "#e8a040", fontSize: 12, flex: 1, lineHeight: 1.4 }}>
              ⚠ {colorWarning}
            </span>
            <button
              onClick={onDismissColorWarning}
              style={{ background: "none", border: "none", color: "#a06020",
                cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
            >✕</button>
          </div>
        )}

        {/* ── Import tab ── */}
        <div
          onClick={() => this.setState({ importerOpen: !importerOpen })}
          style={{
            background: "#44444488", color: "white", textAlign: "center",
            padding: "6px 0", cursor: "pointer", userSelect: "none",
            fontSize: "13px", borderBottom: "1px solid #666",
          }}
        >
          {importerOpen ? "▲ Close Import" : "▼ Import Deck"}
        </div>

        {/* ── Importer drawer ── */}
        {importerOpen && (
          <div style={{
            position: "absolute", top: "31px", left: 0, right: 0,
            background: "#222222ee", zIndex: 9, backdropFilter: "blur(4px)",
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

              {/* Change printing — MTG only */}
              {game === "MTG" && (
                <button
                  onClick={() => {
                    if (printingsOpen) {
                      this.setState({ printingsOpen: false });
                    } else {
                      this.fetchPrintings(selectedCard.cardname);
                    }
                  }}
                  style={{ ...btnBase, border: "1px solid #445", color: "#888" }}
                >
                  {printingsOpen ? "▲ Close Printings" : "▼ Change Printing"}
                </button>
              )}

              {printingsOpen && (
                <div style={{
                  marginTop: 6, maxHeight: 220, overflowY: "auto",
                  border: "1px solid #333", borderRadius: 4, padding: 6, background: "#111",
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

              {/* Toggle connections */}
              <button
                onClick={() => onToggleDisabled(selectedCard.cardname)}
                style={{
                  ...btnBase,
                  border: disabledCards.has(selectedCard.cardname) ? "1px solid #88aaff" : "1px solid #445",
                  color: disabledCards.has(selectedCard.cardname) ? "#88aaff" : "#888",
                }}
              >
                {disabledCards.has(selectedCard.cardname)
                  ? "⬤ Connections enabled" : "○ Disable connections"}
              </button>

              {/* Remove card from deck */}
              {!confirmRemove ? (
                <button
                  onClick={() => this.setState({ confirmRemove: true })}
                  style={{ ...btnBase, border: "1px solid #622", color: "#a55" }}
                >
                  ✕ Remove from deck
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    onClick={() => this.setState({ confirmRemove: false })}
                    style={{
                      flex: 1, padding: "5px 0", background: "none",
                      border: "1px solid #445", borderRadius: 4,
                      color: "#888", cursor: "pointer", fontSize: 11,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onRemoveCard(selectedCard.cardname);
                      this.setState({ confirmRemove: false });
                    }}
                    style={{
                      flex: 1, padding: "5px 0", background: "#1a0a0a",
                      border: "1px solid #e55", borderRadius: 4,
                      color: "#e55", cursor: "pointer", fontSize: 11,
                    }}
                  >
                    Confirm remove
                  </button>
                </div>
              )}

              {/* Card text */}
              <div style={{ marginTop: 4 }}>
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

          {/* ── Add card ── */}
          {hasDeck && (
            <div style={{
              marginTop: 16, padding: "10px 8px 8px",
              borderTop: "1px solid #2a2a2a",
            }}>
              <div style={{ color: "#666", fontSize: 10, letterSpacing: "0.06em", marginBottom: 6 }}>
                ADD CARD
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={addCardName}
                  onChange={e => onAddCardNameChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") onAddCard(); }}
                  placeholder="Card name..."
                  disabled={addCardLoading}
                  style={{
                    flex: 1, background: "#111", border: "1px solid #445",
                    borderRadius: 4, color: "white", padding: "4px 8px",
                    fontSize: 11,
                  }}
                />
                <button
                  onClick={onAddCard}
                  disabled={addCardLoading || !addCardName.trim()}
                  style={{
                    background: "#223", border: "1px solid #88aaff",
                    borderRadius: 4, color: "#88aaff",
                    cursor: addCardLoading || !addCardName.trim() ? "default" : "pointer",
                    fontSize: 11, padding: "4px 10px", whiteSpace: "nowrap",
                    opacity: addCardLoading || !addCardName.trim() ? 0.5 : 1,
                  }}
                >
                  {addCardLoading ? "..." : "+ Add"}
                </button>
              </div>
              {addCardError && (
                <div style={{ color: "#e55", fontSize: 10, marginTop: 4 }}>
                  {addCardError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default CardDescription;