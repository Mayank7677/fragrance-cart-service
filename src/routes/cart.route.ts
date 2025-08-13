import express from "express";
import { addToCart, getCartData } from "../controllers/cart.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const cartRouter = express.Router();

cartRouter.post("/add-to-cart", authMiddleware, addToCart);

cartRouter.get("/", authMiddleware, getCartData);

export default cartRouter;
