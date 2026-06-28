import asyncHandler from "express-async-handler";
import { chatClient, streamClient } from "../lib/stream.js";
import { Session } from "../models/session.model.js";

export const createSession = asyncHandler(async (req, res) => {
  const { problemTitle, difficulty } = req.body;
  const userId = req.user._id;
  const clerkId = req.user.clerkId;

  if (!problemTitle || !difficulty)
    return res
      .status(400)
      .json({ message: "ProblemTitle and Difficulty are required!!!" });

  // ! generate a unique callId for Stream video call
  const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // ! save session in DB
  const session = await Session.create({
    problemTitle,
    difficulty,
    host: userId,
    callId,
  });

  try {
    // ! create Stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problemTitle, difficulty, sessionId: session._id.toString() },
      },
    });

    // ! create Stream Chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problemTitle} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });
    await channel.create();
  } catch (err) {
    // ! rollback DB session if Stream fails
    await Session.findByIdAndDelete(session._id);
    return res.status(500).json({
      message: "Failed to create Stream resources, session rolled back",
    });
  }

  res.status(201).json({ session });
});

export const getActiveSessions = asyncHandler(async (_, res) => {
  const sessions = await Session.find({ status: "active" })
    .populate("host", "name profileImage clerkId")
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({ sessions });
});

export const getMyRecentSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // ! get session where user is either 'host' or 'participant'
  const sessions = await Session.find({
    status: "completed",
    $or: [{ host: userId }, { participant: userId }],
  }).sort({ createdAt: -1 });

  res.status(200).json({ sessions });
});

export const getSessionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const session = await Session.findById(id)
    .populate("host", "name profileImage")
    .populate("participant", "name profileImage");

  if (!session)
    return res.status(404).json({ message: "Session Not Found!!!" });

  res.status(200).json({ session });
});

export const joinSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const clerkId = req.user.clerkId;

  // ! single atomic operation — find and update only if all conditions pass
  const session = await Session.findOneAndUpdate(
    {
      _id: id,
      status: "active", // must be active session
      participant: null, // must have no participant yet
      host: { $ne: userId }, // user cannot join their own session
    },
    { participant: userId },
    { new: true }, // return updated document
  );

  // ! if null — session not found, full, ended, or user is the host
  if (!session)
    return res
      .status(400)
      .json({ message: "Session not found, full, or already ended" });

  const channel = chatClient.channel("messaging", session.callId);
  await channel.addMembers([clerkId]);

  res.status(200).json({ session });
});

export const endSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const session = await Session.findById(id);

  if (!session)
    return res.status(404).json({ message: "Session Not Found!!!" });

  if (session.host.toString() !== userId.toString())
    return res.status(403).json({ message: "Only host can end the session" });

  if (session.status === "completed")
    return res.status(400).json({ message: "Session has already ended!!!" });

  // ! await the save before touching Stream resources
  session.status = "completed";
  await session.save();

  // ! delete Stream video call
  const call = streamClient.video.call("default", session.callId);
  await call.delete({ hard: true });

  // ! delete Stream chat channel
  const channel = chatClient.channel("messaging", session.callId);
  await channel.delete();

  // ! send success response
  res.status(200).json({ message: "Session ended successfully" });
});
