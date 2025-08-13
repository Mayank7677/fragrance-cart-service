import { Document, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
  status: "active" | "abandoned" | "checked_out";
  isActive: boolean;
}

export interface ICartDocument extends ICart, Document {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
