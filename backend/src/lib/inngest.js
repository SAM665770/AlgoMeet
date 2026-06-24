import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.models.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "algo-meet" });

// function to add user in MongoDB
const syncUser = inngest.createFunction(
  { id: "sync-user", triggers: { event: "clerk/user.created" } },
  async ({ event }) => {
    await connectDB();
    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;

    const newUser = {
      clerkId: id,
      name: `${first_name || ""} ${last_name || ""}`,
      email: email_addresses[0]?.email_address,
      profileImage: image_url,
    };

    await User.create(newUser);

    // todo: dp something else
  },
);

// function to delete user from MongoDB
const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db", triggers: { event: "clerk/user.deleted" } },

  async ({ event }) => {
    await connectDB();
    const { id } = event.data;

    await User.deleteOne({ clerkId: id });

    // todo: dp something else
  },
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUser, deleteUserFromDB];
