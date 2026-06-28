import asyncHandler from "express-async-handler";
import { chatClient } from "../lib/stream.js";

export const getStreamToken = asyncHandler(async (req, res) => {
  // ! use clerkId for Stream (not MongoDB _id) => it should match the id we have in Stream dashboard
  const token = chatClient.createToken(req.user.clerkId);

  res.status(200).json({ token, username: req.user.name });
});
