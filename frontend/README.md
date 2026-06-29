Why I Chose TanStack Query for AlgoMeet
One of the key libraries I decided to use in the frontend of AlgoMeet is TanStack Query (formerly known as React Query).
The main reason I chose it is because it makes data fetching, caching, synchronization, and background updates much simpler and more powerful compared to writing everything manually with useState and useEffect.
In a typical beginner approach, whenever I needed to fetch data — for example, the list of active interview sessions or past sessions on the dashboard — I would have to manually manage several things: a state for the data, a loading state to show spinners, an error state, and a useEffect to trigger the fetch. That quickly becomes 15–20 lines of repetitive code for every API call. On top of that, I would have to write extra logic myself for things like retrying failed requests, refetching data when the user returns to the tab, or keeping the data fresh without forcing a page refresh.
TanStack Query solves all of this elegantly. It provides a simple useQuery hook that handles loading, error, and data states automatically. I just pass it a function that fetches the data, and it takes care of the rest. It also gives powerful built-in features such as automatic background refetching, caching, stale-while-revalidate, and window focus refetching — so when a user switches tabs and comes back, they get the latest data without any extra work from me.
In AlgoMeet, this was especially useful for:

Fetching and keeping active sessions up to date on the dashboard
Managing session details during live interviews
Handling mutations (like joining or ending a session) with useMutation

Overall, using TanStack Query helped me write cleaner, more maintainable code, reduced bugs related to data synchronization, and improved the user experience with automatic background updates. It let me focus more on building the core interview features rather than managing low-level data fetching logic.

Key Benefits That Mattered for AlgoMeet

Massive reduction in boilerplate — No more repeating loading/error states across dashboard, problems, and session pages.
Automatic background synchronization — When a candidate joins a session or the host ends it, other tabs/windows automatically get fresh data thanks to refetchOnWindowFocus and query invalidation.
Built-in caching & deduplication — Multiple components asking for the same session data share the cache automatically.
Optimistic updates & mutations — Using useMutation + queryClient.invalidateQueries() or setQueryData for instant UI feedback when creating/joining sessions.
Excellent devtools — The TanStack Query Devtools were invaluable during development to inspect cache state and debug stale data issues.
Seamless integration with our stack — Works perfectly with Axios for API calls and plays nicely with Clerk auth (we pass the token via query context).

In the final architecture, I wrapped the app with QueryClientProvider, created custom hooks like useActiveSessions, useSessionById, useProblems, etc., making data fetching extremely clean and maintainable.
Would I choose it again? 100%. For any data-heavy React application, especially one with real-time collaboration elements like AlgoMeet, TanStack Query is one of the highest-ROI libraries you can add.
It let us focus on building the actual interview experience — video calls with Stream, the VS Code-powered editor, and live chat — instead of fighting state management.