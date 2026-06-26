## User Sync with Clerk + Inngest

This code creates two **Inngest background functions** that keep MongoDB in sync with Clerk's user lifecycle events.

**How it works:**
Clerk fires webhook events → Inngest receives them → functions run automatically in the background.

---

### `syncUser`

- Triggers on `clerk/user.created`
- Extracts `id`, `email_addresses`, `first_name`, `last_name`, `image_url` from the Clerk event payload
- Maps Clerk's data to the MongoDB `User` schema and calls `User.create()`
- `email_addresses[0]?.email_address` — takes the first email with optional chaining in case it's missing

### `deleteUserFromDB`

- Triggers on `clerk/user.deleted`
- Finds the user in MongoDB by `clerkId` and removes them with `User.deleteOne()`

---

### Why `clerkId` instead of MongoDB's `_id`?

Clerk is the source of truth for auth. Storing `clerkId` lets you look up users across both systems without passing MongoDB `_id`s through Clerk.

### Why Inngest instead of a direct webhook?

Inngest provides retries, logging, and reliability out of the box — if MongoDB is down when Clerk fires the event, Inngest retries automatically instead of silently failing.

## Challenges Faced

### Challenge 1: Connecting Clerk, MongoDB, Inngest, and Stream using Webhooks

One of the early challenges I faced while building AlgoMeet was syncing user data between Clerk (our authentication service) and our MongoDB database.

When a user signed up through Clerk, the account was created successfully in Clerk. However, this information was not automatically saved in our MongoDB database. This created a problem because we needed the user records in MongoDB to manage interview sessions, store history, and connect with other services like Stream for video calling.

**To solve this, I used webhooks.**

Webhooks are automated notifications sent from one service to another when a specific event happens. In this case, Clerk sends a webhook whenever a new user is created or updated.

I integrated Inngest (a background job service) to handle these webhooks. Here is how it worked:

1. Clerk triggers a webhook event on user creation
2. Inngest receives this webhook and runs a background job asynchronously
3. The job saves (or updates) the user data in MongoDB using Mongoose
4. At the same time, it also creates the user record in Stream so that video and chat features work properly later

I implemented this using a dedicated controller and lib folder structure, with error handling, retry logic in Inngest, and Clerk middleware for security.

This approach kept the login process fast on the frontend while handling the heavier work in the background. It successfully synced user data across Clerk, MongoDB, and Stream without blocking the user experience.

**Key Learning:** It taught me the importance of decoupling authentication from core application logic using background jobs and webhooks. In the future, I might add caching (like Redis) to further improve performance at scale.
