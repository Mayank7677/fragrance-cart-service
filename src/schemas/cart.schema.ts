import { Document, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  status: "active" | "abandoned" | "checked_out";
  isActive: boolean;
}

export interface ICartDocument extends ICart, Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
