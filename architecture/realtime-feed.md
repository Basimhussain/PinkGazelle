# Realtime Feed SOP

## 1. Goal
Provide immediate visibility into project activity without page refreshes.

## 2. Data Source
The `activity_log` table in Supabase.

## 3. Subscription Rules
- **Scope:** Filtered strictly by `project_id`. The client must never subscribe to the global channel.
- **Hook Strategy:** A custom React Hook `useRealtimeActivity(projectId)` manages the subscription lifecycle.
- **Connection Closure:** The `useEffect` cleanup function MUST un-sub from the channel (`supabase.removeChannel(channel)`).

## 4. UI Layer
- Activities arrive over the wire and are prepended to the top of the activity list.
- Because timestamps rely on database insert times, the UI must use the `timeAgo` utility to format the date locally relative to `Date.now()`.
