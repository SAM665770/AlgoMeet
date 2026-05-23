import express from "express";
import dotenv from "dotenv/config";

const app = express();


const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ message: "api is up and running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
