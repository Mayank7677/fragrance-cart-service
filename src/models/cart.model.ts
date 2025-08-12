import { model, Schema } from "mongoose";
import { ICartDocument, ICartItem } from "../schemas/cart.schema";

const CartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    type: Schema.Types.ObjectId,
    ref: "Variant",
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  }
}, { _id: false });

const CartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Faster lookups
    },
    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: (items: ICartItem[]) => items.length > 0,
        message: "Cart must contain at least one item."
      }
    },
    status: {
      type: String,
      enum: ["active", "abandoned", "checked_out"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate totalPrice per item before saving
CartSchema.pre("save", function (next) {
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.price;
  });
  next();
});

export default model<ICartDocument>("Cart", CartSchema);
