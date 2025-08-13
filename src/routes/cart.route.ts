import express from "express";
import {
  addToCart,
  getCartData,
  removeCartItem,
  updateCartItemQuantity,
} from "../controllers/cart.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const cartRouter = express.Router();

cartRouter.post("/add-to-cart", authMiddleware, addToCart);

cartRouter.get("/", authMiddleware, getCartData);

cartRouter.patch(
  "/update-cart/:itemId",
  authMiddleware,
  updateCartItemQuantity
);

cartRouter.delete("/remove-item/:itemId", authMiddleware, removeCartItem);

export default cartRouter;
