import Card from './Card.ts'

class Deck {
    name: string = "";
    cards: {[id: number]: Card} = {};

    constructor(name:string);
    constructor(name:string, cards: {[id: number]: Card});

    constructor(name: string, cards?: {[id: number]: Card}) {
        this.name = name;
        this.cards = cards ?? {};
    }


    //Add a new card to the cards dict
    addCard(card: Card): void {
        this.cards[card.id] = card;
    }

    //Get and return a card from the cards dict
    getCard(id: number): Card {
        return this.cards[id];
    }
}

export default Deck;