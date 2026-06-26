import { chatClient } from "../lib/stream.js";

export const getStreamToken = async (req, res) => {
  try {
    // ! use clerkId for Stream (not MongoDB _id) => it should match the id we have in Stream dashboard
    const token = chatClient.createToken(req.user.clerkId);

    res.status(200).json({ token, username: req.user.name });
  } catch (error) {
    console.error("Error in getStreamToken controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
