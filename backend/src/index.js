import express from "express";
import dotenv from "dotenv/config";
import { connectDB } from "./lib/db.js";

const app = express();

const PORT = process.env.PORT || 3000;

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


