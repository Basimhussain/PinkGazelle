# Ticket Lifecycle SOP

## 1. Goal
Define deterministic rules for ticket creation, status changes, and corresponding activity logging.

## 2. Statuses
- `todo`
- `in_progress`
- `done`

## 3. Creation Rules
- **Actor:** Admin only.
- **Payload:** `title`, `description` (optional), `project_id`.
- **Default Status:** `todo`.
- **Trigger Response:** Inserting a ticket MUST automatically insert a row into `activity_log` stating "Admin created a new ticket".

## 4. Status Update Rules
- **Actor:** Admin only.
- **Payload:** `ticket_id`, new `status`.
- **Trigger Response:** Changing a status MUST automatically insert a row into `activity_log` (e.g., "Admin moved ticket to In Progress").
- **Secondary Effect:** Because project progress is calculated based on ticket statuses, any UI component relying on progress must re-run `computePercentage()` when a status changes.
