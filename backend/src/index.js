import dotenv from "dotenv/config";
import express from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "./lib/inngest.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import { protectRoute } from "./middlewares/protectRoute.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

const PORT = process.env.PORT || 3000;

// ! middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // ? server allows browser to include cookies in request
  }),
);
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use(clerkMiddleware()); // ? this add auth field to request object: req.auth()
app.use("/api/chats", chatRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "api is up and running" });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log("💥Error starting the server:", err));
