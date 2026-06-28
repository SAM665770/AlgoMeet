import asyncHandler from "express-async-handler";
import { requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";

export const protectRoute = [
  requireAuth(),
  asyncHandler(async (req, res, next) => {
    const clerkId = req.auth().userId;

    if (!clerkId)
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });

    // ! find user in DB by clerkId
    const user = await User.findOne({ clerkId });

    if (!user) return res.status(404).json({ message: "User not found !!!" });

    // ! attach user to req
    req.user = user;

    next();
  }),
];
