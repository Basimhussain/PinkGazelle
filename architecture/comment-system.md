# Comment System SOP

## 1. Goal
Provide a bidirectional communication channel on Tickets between Admin and Client.

## 2. RLS & Access
- The `comments` table RLS allows a Client to INSERT only if the `ticket_id` belongs to their single assigned project.
- Admin can respond to any comment.

## 3. Activity Feed Integration
- A PostgreSQL trigger MUST fire on `INSERT` into `comments` to create a corresponding `activity_log` entry (e.g., "Client commented on ticket").

## 4. Edge Notification
- Supabase Edge Function `send-comment-notify` is triggered via PostgreSQL webhook on `comments` insertion.
- The Notification logic determines the *other* party.
  - If `author.role === 'client'`, fetch the Admin's email and alert them via Resend.
  - If `author.role === 'admin'`, fetch the associated Client's email and alert them via Resend.
