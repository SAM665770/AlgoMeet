import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.models.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "algo-meet" });

// function to add user in MongoDB and Stream
const syncUser = inngest.createFunction(
  { id: "sync-user", triggers: { event: "clerk/user.created" } },
  async ({ event }) => {
    // ! saving user to MongoDB
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

    // ! saving user to Stream
    await upsertStreamUser({
      id: newUser.clerkId.toString(),
      name: newUser.name,
      image: newUser.profileImage,
    });
  },
);

// function to delete user from MongoDB and Stream
const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db", triggers: { event: "clerk/user.deleted" } },
  
  async ({ event }) => {
    // ! deleting user from MongoDB
    await connectDB();
    const { id } = event.data;

    await User.deleteOne({ clerkId: id });

    // ! deleting user from Stream
    await deleteStreamUser(id.toString());
  },
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUser, deleteUserFromDB];
