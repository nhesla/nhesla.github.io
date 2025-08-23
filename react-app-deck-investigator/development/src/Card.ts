class Card {
  id: number;
  quantity: number;
  title: string;
  imgURL: string;
  isDoubleSided: Boolean;

  constructor(id:number, quantity:number, title:string, imgURL: string, isDoubleSided:Boolean) {
    this.id = id
    this.quantity = quantity
    this.title = title
    this.imgURL = imgURL
    this.isDoubleSided = isDoubleSided
  }
}

export default Card;
