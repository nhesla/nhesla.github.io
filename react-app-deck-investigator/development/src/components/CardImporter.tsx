import React, { Component } from "react";

interface DeckListProps {
  onDeckUpdate: (deckList: Card[]) => void;
}
export interface cardInfo {
    name: string; imageUrl: string; text: string; 
    //str_: string[];
    //int_: number[];
    //bool_: boolean[];
}
export interface Card {
    cardname: string; 
    info: cardInfo[]; 
    
    isSplit: boolean;   //split or adventure
    isDFC: boolean;     //modal_dfc, transform, meld, battle
    isFlip: boolean;    //flip

    quantity: string;
    x: number; y: number ;

    connections?: string[];
}

interface DeckListState {
  list_of_cards: string;
  game: string;
  deck_list: Card[];
}

class Deck_Manager extends Component<DeckListProps, DeckListState> {
  constructor(props: DeckListProps) {
    super(props);
    this.state = {
      list_of_cards: "",
      game: "MTG",
      deck_list: [],
    };
  }

  fetchCardData = async (listOfCards: string, game: string) => {
    // Step 1: Parse lines like "3x Lightning Bolt"
    const parsedList = listOfCards
      .split("\n")
      .map(line => line.trim())  // Remove extra whitespace from each line
      .filter(line => line.length > 0)  // Ignore empty or whitespace-only lines
      .map(line => {
        // If the line contains a quantity (e.g., 2x Swamp)
        const match = line.match(/^(\d+)x?\s+(.*)$/i);
        if (match) {
          return {
            quantity: match[1],  // Capture quantity (e.g., 2)
            name: match[2].trim(), // Capture the card name (e.g., Swamp)
          };
        } else {
          // If no quantity is specified, default to 1
          return {
            quantity: "1",
            name: line,
          };
        }
      });
  
    let fetchedCards: any[] = [];
  
    try {
      // Escape special characters to prevent issues with the "OR" operator in queries
      const escapeSpecialChars = (str: string) =>
        str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\]^`{|}~]/g, "\\$&");
  
      if (game === "MTG") {
        const query = parsedList
          .map(({ name }) => {
            // If it's a split card, just use the first part for the search
            const searchName = name.includes(" // ") ? name.split(" // ")[0] : name;
            return `!"${escapeSpecialChars(searchName)}"`; // Search by escaped first name only
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
      console.log(parsedList);
      const deckCards: Card[] = parsedList.map(({ name, quantity }, idx) => {
        const inputName = (name && name.toLowerCase().split(" // ")[0].trim()) || "";
  
        const matched = fetchedCards.filter(card => {
          let cardName = "";
          if (game === "MTG") {
            cardName = card.card_faces?.[0]?.name?.toLowerCase() || card.name.toLowerCase();
          } else if (game == "YGO") {
            cardName = card.name.toLowerCase();
          } else {
            cardName = (card.Name ?? "Be Prepared").toLowerCase();
          }
          return cardName === inputName;
        });
  
        const info: cardInfo[] = matched.flatMap(card => {
          if (game === "MTG") {
            if (card.card_faces && Array.isArray(card.card_faces)) {
              return card.card_faces.map((face: any) => ({
                name: face.name,
                imageUrl: face.image_uris?.normal || card.image_uris?.normal || "",
                text: face.oracle_text || "",
              }));
            } else {
              return [{
                name: card.name,
                imageUrl: card.image_uris?.normal || "",
                text: card.oracle_text || "",
              }];
            }
          } else if (game === "YGO") {
            return [{
              name: card.name,
              imageUrl: card.card_images?.[0]?.image_url || "",
              text: card.desc || "",
            }];
          } else if (game === "LOR") {
            return [{
              name: card.Name,
              imageUrl: card.Image || null,
              text: card.Body_Text || "",
            }];
          } else {
            return [];
          }
        });
  
        // Detect MTG card types
        let isSplit = false, isDFC = false, isFlip = false;
        if (game === "MTG" && matched.length > 0) {
          const layout = matched[0].layout;
          isSplit = layout === "split" || layout === "adventure";
          isDFC = ["modal_dfc", "transform", "meld", "battle"].includes(layout);
          isFlip = layout === "flip";
        }

        return {
          cardname: info.length > 1
            ? `${info[0]?.name || "UNKNOWN"} // ${info[1]?.name || "UNKNOWN"}`
            : info[0]?.name || "UNKNOWN",
          info,
          isSplit,
          isDFC,
          isFlip,
          quantity,
          x: 750 - 70 * Math.floor(idx / 8),
          y: 10 + 80 * (idx % 8),
        };
      });
  
      deckCards.forEach(c => {
        if (c.info.length > 1) {
          console.log("\n\ncardname: " + (c.cardname ?? "UNDEFINED")
                  + ",\nn0: " + (c.info[0]?.name ?? "UNDEFINED")
                  + ",\nimg0: " + (c.info[0]?.imageUrl ?? "UNDEFINED")
                  + ",\ntext0: " + (c.info[0]?.text ?? "UNDEFINED")
                  + ",\nn1: " + (c.info[1]?.name ?? "UNDEFINED")
                  + ",\nimg1: " + (c.info[1]?.imageUrl ?? "UNDEFINED")
                  + ",\ntext1: " + (c.info[1]?.text ?? "UNDEFINED")
                  + "\nisSplit: " + (c.isSplit ?? "UNDEFINED") + ", isDFC: " + (c.isDFC ?? "UNDEFINED") + ", isFlip: " + (c.isFlip ?? "UNDEFINED"));
        } else {
          console.log("\n\ncardname: " + (c.cardname ?? "UNDEFINED")
                  + ",\nn0: " + (c.info[0]?.name ?? "UNDEFINED")
                  + ",\nimg0: " + (c.info[0]?.imageUrl ?? "UNDEFINED")
                  + ",\ntext0: " + (c.info[0]?.text ?? "UNDEFINED")
                  + "\nisSplit: " + (c.isSplit ?? "UNDEFINED") + ", isDFC: " + (c.isDFC ?? "UNDEFINED") + ", isFlip: " + (c.isFlip ?? "UNDEFINED"));
        }        
      });

      this.setState({ deck_list: deckCards });
      this.props.onDeckUpdate(deckCards);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    }
  };
  


  handleListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ list_of_cards: e.target.value });
  };

  handleTCGChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ game: e.target.value });
  };

  handleUpdateDeck = () => {
    this.fetchCardData(this.state.list_of_cards, this.state.game)
  };

  render() {
    return (
      <div style={{ width: "300px", padding: "20px", overflow: "auto", margin: "auto" }}>
        <div>
          <label>
            Select Card Game:
            <select value={this.state.game} onChange={this.handleTCGChange}>
              <option value="MTG">Magic the Gathering</option>
              <option value="YGO">Yu-Gi-Oh!</option>
              <option value="LOR">Lorcana</option>
            </select>
          </label>
        </div>
        <textarea
          value={this.state.list_of_cards}
          onChange={this.handleListChange}
          rows={10}
          style={{ width: "100%", marginTop: "10px" }}
        />
        <button onClick={this.handleUpdateDeck} style={{ marginTop: "10px", margin: "auto" }}>
          Update Decklist
        </button>
      </div>
    );
  }
}

export default Deck_Manager;
/* */
