import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./configs/connectDB";
import cookieParser from "cookie-parser";
import configureCors from "./configs/cors.config";
import { errorHandler } from "./middlewares/errorHandler";
import limiter from "./middlewares/rateLimit";

import cartRouter from "./routes/cart.route";


const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(configureCors());
app.use(limiter);

// Routes
app.use("/api/carts", cartRouter);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
