# Decisions

Log the decisions that actually shaped this codebase — the ones where a real alternative existed and
you picked one. At least five entries. For each: what you chose, what you rejected, and why. At least
one entry must be a decision you later reversed — say what changed your mind. It can be any entry
below, not necessarily the last one; add a **Later reversed:** line to whichever one it is.

## Decision 1

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 2

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 3

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 4

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 5

- **Chose:**
- **Rejected:**
- **Why:**


## Decision 1: Use JWT for authentication

### Chosen
JWT authentication using `djangorestframework-simplejwt`.

### Rejected
Session-based authentication.

### Why
The frontend and backend are separate applications, so JWT is easier to use for API authentication between React and Django.

### Result
The backend provides access and refresh tokens, and protected endpoints identify users using the access token.

## Decision 2
- **Chose:** Dedicated transition endpoint for task status changes.
- **Rejected:** Changing status through normal PATCH.
- **Why:** Prevents bypassing lifecycle validation.

## Decision 3
- **Chose:** Store `previous_status` for blocked tasks.
- **Rejected:** Returning blocked tasks to a fixed status.
- **Why:** Allows a blocked task to return to its previous state.

## Decision 4
- **Chose:** Server-side validation of project membership for assignees.
- **Rejected:** Allowing any user to be assigned.
- **Why:** Only project members can be assigned to project tasks.

## Decision 5
- **Chose:** Reuse server-side filtering for search and CSV export.
- **Rejected:** Maintaining separate filtering logic.
- **Why:** Keeps results consistent and avoids duplicated logic.

## Decision 6: Generate overdue alerts through the API

- **Chose:** Generate missing overdue alerts when the alerts endpoint is requested.
- **Rejected:** Adding a background worker or scheduled job.
- **Why:** The API approach was simpler and was enough for the assignment without adding another service.

## Decision 7: Start with a task list for the dashboard

- **Chose:** Initially display the 8-week completion data as a simple list.
- **Rejected:** Adding a chart immediately.
- **Why:** I focused first on getting the required dashboard data and calculations working correctly.


- **Later reversed:** The requirement specifically expects completions over the last 8 weeks to be shown as a chart, so the list will be replaced with a chart before final submission.