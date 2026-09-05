# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** <[public repo URL](https://github.com/KANDREGULA-SAI/project-management-tool)>
- **Live application:** <[deployed URL](https://project-management-tool-one-chi.vercel.app/)>

## Notes for the reviewer

<Anything we should know before opening the link — e.g. your host sleeps when idle and the first
request can take up to a minute.>
The frontend is deployed on Vercel and the Django REST API is deployed on Render.
The backend uses PostgreSQL in production.

The Render free service may sleep when idle, so the first request after inactivity may take some time.

Demo data can be created using the provided demo accounts.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@example.com | manager123 |
| Member | member@example.com | member123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React, TypeScript, Vite | Fast development and a simple component-based UI |
| Backend | Python, Django, Django REST Framework | Handles APIs, authentication, permissions and business rules |
| Database | SQLite locally, PostgreSQL in production | SQLite keeps local development simple; PostgreSQL is used for production |
| Hosting | Vercel + Render | Vercel hosts the frontend and Render hosts the Django API and PostgreSQL database |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Manager and Member roles are implemented with server-side permission checks. |
| 2 | Projects | Done | Managers can create, edit, archive, restore and manage project membership. Archived projects are hidden by default. |
| 3 | Tasks | Done | Tasks support title, description, priority, due date, blocking tasks and project association. |
| 4 | Task lifecycle | Done | Backlog, In Progress, In Review, Blocked and Done transitions are validated server-side. Blocking tasks prevent invalid completion. |
| 5 | Assignment | Done | Tasks support multiple assignees. Only project members can be assigned and removing a project member unassigns their tasks. |
| 6 | Finding tasks | Done | Global task search, filters, sorting, pagination and total count are handled server-side. |
| 7 | Bulk actions | Done | Multiple tasks can be selected for bulk status, assignee or due-date changes. CSV export is also supported. |
| 8 | Dashboard | Partial | Dashboard metrics and status/assignee breakdowns are implemented. The 8-week completion data is available, but the chart visualization could be improved further. |
| 9 | History | Done | Task history is immutable and records creation, field changes, assignments, unassignments and comments. |
| 10 | Alerts | Done | Overdue unfinished assigned tasks appear in alerts. Users can dismiss alerts and due-date changes make the alert appear again. |

## How much time did you actually spend?
Approximately 12 hours.

Most of the time was spent implementing the required backend rules, connecting the frontend to the APIs, testing the application, and preparing the deployment.


## What would you do next, with another 12 hours?
I would focus on improving the dashboard with proper charts, polishing the UI, adding more comprehensive automated tests, improving error messages and loading states, and adding better production monitoring.

I would also improve the deployment configuration and add more realistic demo data for the reviewer.

## What are you least happy with in this codebase, and why?
The dashboard is the main area I would improve. The required metrics and breakdown data are implemented, but the completion data would be easier to understand with proper charts.

I would also spend more time improving the frontend structure and adding automated tests for the more complex task lifecycle and permission rules.
