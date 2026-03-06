import React, { Component } from "react";
import { getRandomDeck } from "./SampleDecklists";

interface DeckListProps {
  onDeckUpdate: (deckList: Card[], game: string, rawText: string) => void;
  saves: import("./SaveManager").DeckSave[];
  currentDecklistText: string;
  onSave: (name: string) => void;
  onLoad: (save: import("./SaveManager").DeckSave) => void;
  onDelete: (name: string) => void;
  onExportSingle: (save: import("./SaveManager").DeckSave) => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
}

export interface cardInfo {
  // ── Universal ────────────────────────────────────────────
  name:       string;
  imageUrl:   string;
  text:       string;
  typeLine:   string;

  superTypes: string[];
  cardTypes:  string[];
  subTypes:   string[];

  cost:       number | null;
  keywords:   string[];

  // ── Combat stats ─────────────────────────────────────────
  power:      number | null;
  toughness:  number | null;

  // ── Game-specific ─────────────────────────────────────────
  manaCost:      string | null;
  lore:          number | null;
  inkable:       boolean | null;
  characterName: string | null;
}

export interface Card {
  cardname: string;
  info: cardInfo[];

  isSplit: boolean;
  isDFC:   boolean;
  isFlip:  boolean;

  quantity: string;
  x: number;
  y: number;

  connections?: string[];
}

interface DeckListState {
  list_of_cards: string;
  game: string;
  deck_list: Card[];
  sampleDeckName: string | undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMTGTypeLine(typeLine: string): {
  superTypes: string[]; cardTypes: string[]; subTypes: string[];
} {
  const MTG_SUPERTYPES = ["Basic", "Legendary", "Snow", "World", "Ongoing"];
  const parts = typeLine.split(/[—–-]/);
  const leftTokens  = (parts[0] ?? "").trim().split(/\s+/).filter(Boolean);
  const rightTokens = (parts[1] ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    superTypes: leftTokens.filter(t => MTG_SUPERTYPES.includes(t)),
    cardTypes:  leftTokens.filter(t => !MTG_SUPERTYPES.includes(t)),
    subTypes:   rightTokens,
  };
}

function parseStat(val: any): number | null {
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

const LORCANA_KEYWORDS = [
  "Evasive","Rush","Bodyguard","Challenger","Reckless",
  "Resist","Support","Ward","Shift","Singer",
];

function parseLorcanaKeywords(text: string): string[] {
  return LORCANA_KEYWORDS.filter(kw => new RegExp(`\\b${kw}\\b`, "i").test(text));
}

function parseLorcanaCharacterName(fullName: string): string | null {
  if (!fullName) return null;
  const parts = fullName.split(" - ");
  return parts.length > 1 ? parts[0].trim() : null;
}

function parseYGOTypeLine(typeStr: string): {
  superTypes: string[]; cardTypes: string[]; subTypes: string[];
} {
  let cardTypes: string[] = [];
  const lower = typeStr.toLowerCase();
  if (lower.includes("monster"))    cardTypes.push("Monster");
  else if (lower.includes("spell")) cardTypes.push("Spell");
  else if (lower.includes("trap"))  cardTypes.push("Trap");
  const modifiers = ["Effect","Fusion","Ritual","Synchro","Xyz",
                     "Link","Pendulum","Flip","Toon","Union","Gemini"];
  const subTypes = modifiers.filter(m => new RegExp(`\\b${m}\\b`, "i").test(typeStr));
  return { superTypes: [], cardTypes, subTypes };
}

// ── Standalone fetch (used by Comp_Manager when loading a save) ──────────────

export async function fetchCardDataStandalone(listOfCards: string, game: string): Promise<Card[]> {
  const parsedList = listOfCards
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const match = line.match(/^(\d+)x?\s+(.*)$/i);
      return match
        ? { quantity: match[1], name: match[2].trim() }
        : { quantity: "1", name: line };
    });

  let fetchedCards: any[] = [];

  const escapeSpecialChars = (str: string) =>
    str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");

  if (game === "MTG") {
    const query = parsedList
      .map(({ name }) => {
        const searchName = name.includes(" // ") ? name.split(" // ")[0] : name;
        return `!"${escapeSpecialChars(searchName)}"`;
      })
      .join(" OR ");
    const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    fetchedCards = data.data ?? [];
  } else if (game === "YGO") {
    const res = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?num=20000&offset=0");
    const data = await res.json();
    fetchedCards = data.data ?? [];
  } else if (game === "LOR") {
    const res = await fetch("https://api.lorcana-api.com/bulk/cards");
    fetchedCards = await res.json();
  }

  const deckCards: Card[] = parsedList.map(({ name, quantity }, idx) => {
    const inputName = (name && name.toLowerCase().split(" // ")[0].trim()) || "";
    const matched = fetchedCards.filter(card => {
      let cardName = "";
      if (game === "MTG") cardName = card.card_faces?.[0]?.name?.toLowerCase() || card.name.toLowerCase();
      else if (game === "YGO") cardName = card.name.toLowerCase();
      else cardName = (card.Name ?? "").toLowerCase();
      return cardName === inputName;
    });

    const info: cardInfo[] = matched.flatMap((card: any) => {
      if (game === "MTG") {
        if (card.card_faces && Array.isArray(card.card_faces)) {
          return card.card_faces.map((face: any) => {
            const tl = face.type_line || card.type_line || "";
            const { superTypes, cardTypes, subTypes } = parseMTGTypeLine(tl);
            return {
              name: face.name, imageUrl: face.image_uris?.normal || card.image_uris?.normal || "",
              text: face.oracle_text || "", typeLine: tl, superTypes, cardTypes, subTypes,
              cost: card.cmc ?? null, keywords: card.keywords ?? [],
              power: parseStat(face.power ?? card.power), toughness: parseStat(face.toughness ?? card.toughness),
              manaCost: face.mana_cost || card.mana_cost || null, lore: null, inkable: null, characterName: null,
            };
          });
        } else {
          const tl = card.type_line || "";
          const { superTypes, cardTypes, subTypes } = parseMTGTypeLine(tl);
          return [{
            name: card.name, imageUrl: card.image_uris?.normal || "",
            text: card.oracle_text || "", typeLine: tl, superTypes, cardTypes, subTypes,
            cost: card.cmc ?? null, keywords: card.keywords ?? [],
            power: parseStat(card.power), toughness: parseStat(card.toughness),
            manaCost: card.mana_cost || null, lore: null, inkable: null, characterName: null,
          }];
        }
      } else if (game === "YGO") {
        const typeStr = card.type || "";
        const { superTypes, cardTypes, subTypes: ts } = parseYGOTypeLine(typeStr);
        const subTypes = card.race ? [card.race, ...ts] : ts;
        return [{
          name: card.name, imageUrl: card.card_images?.[0]?.image_url || "",
          text: card.desc || "", typeLine: typeStr, superTypes, cardTypes, subTypes,
          cost: card.level ?? card.rank ?? card.linkval ?? null, keywords: [],
          power: parseStat(card.atk), toughness: parseStat(card.def),
          manaCost: null, lore: null, inkable: null, characterName: null,
        }];
      } else if (game === "LOR") {
        const fullName = card.Name ?? "";
        const typeStr  = card.Type ?? "";
        const bodyText = card.Body_Text || "";
        return [{
          name: fullName, imageUrl: card.Image || "",
          text: bodyText, typeLine: typeStr,
          superTypes: [], cardTypes: [typeStr],
          subTypes: card.Classifications
            ? (Array.isArray(card.Classifications)
                ? card.Classifications
                : card.Classifications.split(",").map((s: string) => s.trim()))
            : [],
          cost: card.Cost ?? null, keywords: parseLorcanaKeywords(bodyText),
          power: parseStat(card.Strength), toughness: parseStat(card.Willpower),
          manaCost: null, lore: card.Lore ?? null, inkable: card.Inkable ?? null,
          characterName: parseLorcanaCharacterName(fullName),
        }];
      }
      return [];
    });

    return {
      cardname: info.length > 1
        ? `${info[0]?.name || "UNKNOWN"} // ${info[1]?.name || "UNKNOWN"}`
        : info[0]?.name || "UNKNOWN",
      info, isSplit: false, isDFC: false, isFlip: false, quantity,
      x: 750 - 70 * Math.floor(idx / 8),
      y: 10 + 80 * (idx % 8),
    };
  });

  return deckCards;
}

// ── Component ─────────────────────────────────────────────────────────────────

class CardImporter extends Component<DeckListProps, DeckListState> {
  exampleDecks = {
    MTG: `4x Lightning Bolt\n4x Mountain\n2x Shock`,
    YGO: `3x Dark Magician\n2x Blue-Eyes White Dragon\n1x Monster Reborn`,
    LOR: `4x Elsa - Snow Queen\n3x Olaf - Friendly Snowman\n2x Let It Go`,
  };

  constructor(props: DeckListProps) {
    super(props);
    this.state = {
      list_of_cards: "",
      game: "MTG",
      deck_list: [],
      sampleDeckName: undefined,
    };
  }

  handleShowMeSomething = () => {
    const { game, sampleDeckName } = this.state;
    const sample = getRandomDeck(game as "MTG" | "YGO" | "LOR", sampleDeckName);
    this.setState({ list_of_cards: sample.list, sampleDeckName: sample.name });
  };

  fetchCardData = async (listOfCards: string, game: string) => {
    const parsedList = listOfCards
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const match = line.match(/^(\d+)x?\s+(.*)$/i);
        return match
          ? { quantity: match[1], name: match[2].trim() }
          : { quantity: "1", name: line };
      });

    let fetchedCards: any[] = [];

    try {
      const escapeSpecialChars = (str: string) =>
        str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\]^`{|}~]/g, "\\$&");

      if (game === "MTG") {
        const query = parsedList
          .map(({ name }) => {
            const searchName = name.includes(" // ") ? name.split(" // ")[0] : name;
            return `!"${escapeSpecialChars(searchName)}"`;
          })
          .join(" OR ");
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        fetchedCards = data.data;
      } else if (game === "YGO") {
        const res = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?num=20000&offset=0");
        const data = await res.json();
        fetchedCards = data.data;
      } else if (game === "LOR") {
        const res = await fetch("https://api.lorcana-api.com/bulk/cards");
        const data = await res.json();
        fetchedCards = data;
      }

      const deckCards: Card[] = parsedList.map(({ name, quantity }, idx) => {
        const inputName = (name && name.toLowerCase().split(" // ")[0].trim()) || "";

        const matched = fetchedCards.filter(card => {
          let cardName = "";
          if (game === "MTG") {
            cardName = card.card_faces?.[0]?.name?.toLowerCase() || card.name.toLowerCase();
          } else if (game === "YGO") {
            cardName = card.name.toLowerCase();
          } else {
            cardName = (card.Name ?? "").toLowerCase();
          }
          return cardName === inputName;
        });

        const info: cardInfo[] = matched.flatMap(card => {
          if (game === "MTG") {
            if (card.card_faces && Array.isArray(card.card_faces)) {
              return card.card_faces.map((face: any) => {
                const tl = face.type_line || card.type_line || "";
                const { superTypes, cardTypes, subTypes } = parseMTGTypeLine(tl);
                return {
                  name: face.name,
                  imageUrl: face.image_uris?.normal || card.image_uris?.normal || "",
                  text: face.oracle_text || "",
                  typeLine: tl, superTypes, cardTypes, subTypes,
                  cost: card.cmc ?? null,
                  keywords: card.keywords ?? [],
                  power: parseStat(face.power ?? card.power),
                  toughness: parseStat(face.toughness ?? card.toughness),
                  manaCost: face.mana_cost || card.mana_cost || null,
                  lore: null, inkable: null, characterName: null,
                };
              });
            } else {
              const tl = card.type_line || "";
              const { superTypes, cardTypes, subTypes } = parseMTGTypeLine(tl);
              return [{
                name: card.name,
                imageUrl: card.image_uris?.normal || "",
                text: card.oracle_text || "",
                typeLine: tl, superTypes, cardTypes, subTypes,
                cost: card.cmc ?? null,
                keywords: card.keywords ?? [],
                power: parseStat(card.power),
                toughness: parseStat(card.toughness),
                manaCost: card.mana_cost || null,
                lore: null, inkable: null, characterName: null,
              }];
            }
          } else if (game === "YGO") {
            const typeStr = card.type || "";
            const { superTypes, cardTypes, subTypes: typeSubTypes } = parseYGOTypeLine(typeStr);
            const subTypes = card.race ? [card.race, ...typeSubTypes] : typeSubTypes;
            return [{
              name: card.name,
              imageUrl: card.card_images?.[0]?.image_url || "",
              text: card.desc || "",
              typeLine: typeStr, superTypes, cardTypes, subTypes,
              cost: card.level ?? card.rank ?? card.linkval ?? null,
              keywords: [],
              power: parseStat(card.atk),
              toughness: parseStat(card.def),
              manaCost: null, lore: null, inkable: null, characterName: null,
            }];
          } else if (game === "LOR") {
            const fullName = card.Name ?? "";
            const typeStr  = card.Type ?? "";
            const bodyText = card.Body_Text || "";
            return [{
              name: fullName,
              imageUrl: card.Image || "",
              text: bodyText,
              typeLine: typeStr,
              superTypes: [],
              cardTypes: [typeStr],
              subTypes: card.Classifications
                ? (Array.isArray(card.Classifications)
                    ? card.Classifications
                    : card.Classifications.split(",").map((s: string) => s.trim()))
                : [],
              cost: card.Cost ?? null,
              keywords: parseLorcanaKeywords(bodyText),
              power: parseStat(card.Strength),
              toughness: parseStat(card.Willpower),
              manaCost: null,
              lore: card.Lore ?? null,
              inkable: card.Inkable ?? null,
              characterName: parseLorcanaCharacterName(fullName),
            }];
          } else {
            return [];
          }
        });

        let isSplit = false, isDFC = false, isFlip = false;
        if (game === "MTG" && matched.length > 0) {
          const layout = matched[0].layout;
          isSplit = layout === "split" || layout === "adventure";
          isDFC   = ["modal_dfc", "transform", "meld", "battle"].includes(layout);
          isFlip  = layout === "flip";
        }

        return {
          cardname: info.length > 1
            ? `${info[0]?.name || "UNKNOWN"} // ${info[1]?.name || "UNKNOWN"}`
            : info[0]?.name || "UNKNOWN",
          info, isSplit, isDFC, isFlip, quantity,
          x: 750 - 70 * Math.floor(idx / 8),
          y: 10 + 80 * (idx % 8),
        };
      });

      this.setState({ deck_list: deckCards });
      this.props.onDeckUpdate(deckCards, game, listOfCards);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    }
  };

  handleListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ list_of_cards: e.target.value, sampleDeckName: undefined });
  };

  handleTCGChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ game: e.target.value, sampleDeckName: undefined });
  };

  handleUpdateDeck = () => {
    this.fetchCardData(this.state.list_of_cards, this.state.game);
  };

  render() {
    const { list_of_cards, game, sampleDeckName } = this.state;
    const { saves, currentDecklistText, onSave, onLoad, onDelete, onExportSingle, onExportAll, onImport } = this.props;

    return (
      <div style={{ width: "300px", padding: "20px", overflow: "auto", margin: "auto" }}>
        <div>
          <label>
            Select Card Game:
            <select value={game} onChange={this.handleTCGChange}>
              <option value="MTG">Magic the Gathering</option>
              <option value="YGO">Yu-Gi-Oh!</option>
              <option value="LOR">Lorcana</option>
            </select>
          </label>
        </div>

        {sampleDeckName && (
          <div style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#aaa",
            fontStyle: "italic",
          }}>
            Sample: {sampleDeckName}
          </div>
        )}

        <textarea
          value={list_of_cards}
          onChange={this.handleListChange}
          rows={10}
          style={{ width: "100%", marginTop: "8px" }}
          placeholder={this.exampleDecks[game as keyof typeof this.exampleDecks]}
        />

        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button
            onClick={this.handleShowMeSomething}
            style={{ flex: 1, background: "#444", color: "white", border: "1px solid #666", cursor: "pointer", padding: "6px" }}
          >
            Show me something
          </button>
          <button
            onClick={this.handleUpdateDeck}
            style={{ flex: 1, background: "#336", color: "white", border: "1px solid #66a", cursor: "pointer", padding: "6px" }}
          >
            Import
          </button>
        </div>

        <SaveLoadPanel
          saves={saves}
          hasDeck={!!currentDecklistText}
          onSave={onSave}
          onLoad={onLoad}
          onDelete={onDelete}
          onExportSingle={onExportSingle}
          onExportAll={onExportAll}
          onImport={onImport}
        />
      </div>
    );
  }
}

// ── SaveLoadPanel ─────────────────────────────────────────────────────────────

import { DeckSave, formatTimestamp } from "./SaveManager";

interface SaveLoadPanelProps {
  saves: DeckSave[];
  hasDeck: boolean;
  onSave: (name: string) => void;
  onLoad: (save: DeckSave) => void;
  onDelete: (name: string) => void;
  onExportSingle: (save: DeckSave) => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
}

function SaveLoadPanel({
  saves, hasDeck, onSave, onLoad, onDelete, onExportSingle, onExportAll, onImport,
}: SaveLoadPanelProps) {
  const [collapsed,  setCollapsed]  = React.useState(false);
  const [saveName,   setSaveName]   = React.useState("");
  const [saveError,  setSaveError]  = React.useState<string | null>(null);
  const [confirmDel, setConfirmDel] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) { setSaveError("Please enter a name."); return; }
    if (!hasDeck) { setSaveError("Import a deck first."); return; }
    onSave(name);
    setSaveName("");
    setSaveError(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = "";
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    background: "none", border: "1px solid " + color, borderRadius: 3,
    color, cursor: "pointer", fontSize: "10px", padding: "2px 6px",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid #333", paddingTop: 12 }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", marginBottom: 8 }}
      >
        <span style={{ color: "#aaa", fontSize: "11px", letterSpacing: "0.05em" }}>SAVES</span>
        <span style={{ color: "#666", fontSize: "11px" }}>{collapsed ? "▼" : "▲"}</span>
      </div>

      {!collapsed && (
        <>
          {/* Save current deck */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              value={saveName}
              onChange={e => { setSaveName(e.target.value); setSaveError(null); }}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
              placeholder="Save name..."
              style={{
                flex: 1, background: "#111", border: "1px solid #445",
                borderRadius: 4, color: "white", padding: "4px 8px", fontSize: 11,
              }}
            />
            <button
              onClick={handleSave}
              style={{
                background: "#223", border: "1px solid #88aaff", borderRadius: 4,
                color: "#88aaff", cursor: "pointer", fontSize: 11, padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              Save
            </button>
          </div>
          {saveError && (
            <div style={{ color: "#e55", fontSize: 10, marginBottom: 6 }}>{saveError}</div>
          )}

          {/* Save list */}
          {saves.length === 0 ? (
            <div style={{ color: "#555", fontSize: 10, marginBottom: 8 }}>No saves yet.</div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              {saves.map(save => (
                <div key={save.name} style={{
                  padding: "6px 0", borderBottom: "1px solid #222",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#ddd", fontSize: 11, flex: 1, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {save.name}
                    </span>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => onLoad(save)} style={btnStyle("#88aaff")}>Load</button>
                      <button onClick={() => onExportSingle(save)} style={btnStyle("#44cc88")}>↓</button>
                      {confirmDel === save.name ? (
                        <>
                          <button onClick={() => { onDelete(save.name); setConfirmDel(null); }} style={btnStyle("#e55")}>Confirm</button>
                          <button onClick={() => setConfirmDel(null)} style={btnStyle("#888")}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDel(save.name)} style={btnStyle("#e55")}>✕</button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "#555", fontSize: 9, marginTop: 2 }}>
                    {save.game} · {formatTimestamp(save.savedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Export all / Import */}
          <div style={{ display: "flex", gap: 6 }}>
            {saves.length > 0 && (
              <button
                onClick={onExportAll}
                style={{
                  flex: 1, background: "none", border: "1px solid #446",
                  borderRadius: 4, color: "#aaa", cursor: "pointer",
                  fontSize: 10, padding: "4px 0",
                }}
              >
                Export all
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, background: "none", border: "1px solid #446",
                borderRadius: 4, color: "#aaa", cursor: "pointer",
                fontSize: 10, padding: "4px 0",
              }}
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: "none" }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default CardImporter;