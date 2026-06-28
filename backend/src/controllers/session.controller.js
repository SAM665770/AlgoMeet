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

  const session = await Session.findById(id);

  if (!session)
    return res.status(404).json({ message: "Session Not Found!!!" });

  // ! check if session is already full - has a participant
  if (session.participant)
    return res.status(400).json({ message: "Session is full" });

  session.participant = userId;
  await session.save();

  const channel = chatClient.channel("messaging", session.callId);
  await channel.addMembers([clerkId]);

  res.status(200).json({ session });
});

export const endSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const clerkId = req.user.clerkId;

  const session = await Session.findById({ id });

  if (!session)
    return res.status(404).message({ json: "Session Not Found!!!" });

  // ! check if user is the host
  if (session.host.toString() !== userId.toString())
    return res.status(403).message({ json: "Only host can end the session" });

  // ! check if session is already completed
  if (session.status === "completed")
    return res.status(400).message({ json: "Session has already ended!!!" });

  // ! ending the session
  session.status = "completed";
  session.save();

  // ! delete stream video call
  const call = streamClient.video.call("default", session.callId);
  await call.delete({ hard: true });

  // ! delete stream chat channel
  const channel = await chatClient.channel("messaging", session.callId);
  await channel.delete();
});
