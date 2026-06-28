import { StreamChat } from "stream-chat";
import {StreamClient} from "@stream-io/node-sdk"

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("STREAM_API_KEY or STREAM_API_SECRET is missing !!!");
}

export const chatClient = StreamChat.getInstance(apiKey, apiSecret); // will be used for chat features
export const streamClient = new StreamClient(apiKey,apiSecret) // will be used for video calls


export const upsertStreamUser = async (userData) => {
  try {
    await chatClient.upsertUser(userData);
    console.log("Stream User Added Successfully:", userData);
  } catch (error) {
    console.log("Error upserting Stream user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await chatClient.deleteUser(userId);
    console.log("Stream User Deleted Successfully:", userId);
  } catch (error) {
    console.log("Error deleting Stream user:", error);
  }
};


