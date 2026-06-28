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

### Challenge 2: Handling Race Conditions in Session Joining

One of the critical challenges I faced while building AlgoMeet was a race condition that could occur when multiple users tried to join the same interview session at the same time.

**The Problem**

Initially, I handled session joining with separate steps. I would first fetch the session, then check if it existed, whether the user was not the host, and whether the session was still active. This approach looked correct at first. However, I soon realized there was a major issue.

When two users attempted to join the same session simultaneously, both would read the session document and see that the participant field was still empty. Both would pass all the checks. As a result, the first user would join successfully, but the second user would overwrite the participant field — effectively kicking out the first user. Additionally, the early version did not properly prevent users from joining already completed sessions.

This is a classic race condition caused by following a read-check-write pattern, where multiple requests could read the same data before any of them finished writing.

**The Solution**

To solve this, I changed the logic to use a single atomic database operation. Instead of multiple separate steps, I performed the check and update together using MongoDB's `findOneAndUpdate` method. This ensured that only one user could match the required conditions — active session, empty participant slot, and not the host — and update the document at a time.

If the operation returns null, it means someone else already joined or the session was no longer valid, and the second user receives a clear error message. After a successful update, I also added the user to the corresponding Stream chat channel.

This approach completely eliminated the race condition and made the joining process reliable even under concurrent usage.

**Key Learning**

This experience taught me the importance of considering concurrency early when working with shared resources. Using atomic operations significantly improved the reliability of the session management system.
