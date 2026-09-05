# Plan

Answer each of these, in your own words.

- How did you break the work into sessions?
I divided the work into small sessions, starting with the project setup and authentication, then moving to projects, tasks, assignment, search, dashboard, history and alerts. I handled frontend and backend together for each major feature.
- What order did you build in, and why that order?

I divided the project into phases based on which features depend on others.

# Phase 0 — Foundation
GitHub repository
Documentation
Technology stack
Architecture
Initial schema

# Phase 1 — Accounts and Projects
Authentication
Roles
Projects
Project members

# Phase 2 — Tasks
Task CRUD
Dependencies
Task lifecycle

# Phase 3 — Assignment and Search
Task assignments
My Tasks
Search and filters
Pagination

# Phase 4 — Bulk Actions and Dashboard
Bulk updates
CSV export
Dashboard and charts

# Phase 5 — History and Alerts
Task timeline
Comments
Overdue alerts

# Phase 6 — Testing and Deployment
Demo data
Testing
Deployment
Final documentation

I chose this order because later features depend on projects and tasks being implemented first.


- What did you estimate versus what it actually took?
I initially expected the core setup and basic features to take most of the available time. In practice, frontend integration, API testing and fixing issues such as incorrect routes and response formats took more time than expected.

- What did you cut when you ran short?
I focused on the required features first and avoided most stretch features. I also kept some implementations simple, such as generating alerts through the API instead of adding a background worker.

