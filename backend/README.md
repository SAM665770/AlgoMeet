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
