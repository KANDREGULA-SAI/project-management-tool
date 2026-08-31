# Schema

Answer each of these, in your own words.

- Table by table: what columns and types does each one have?

The exact columns and data types will be added when the Django models are created.


- Which relationships are one-to-many, and which are many-to-many?

### Initial entity design
The application requires relational data between users, projects, tasks, assignments, dependencies, history records, comments, and alerts.
The initial planned entities are:
User
Project
ProjectMembership
Task
TaskAssignment
TaskDependency
TaskHistory
Comment
AlertDismissal

## Initial relationship overview

# Users and projects

A user can belong to multiple projects, and a project can contain multiple users.

This is a many-to-many relationship represented through a ProjectMembership entity.

A project also has an owner.

# Projects and tasks

A project can contain many tasks.

Each task belongs to exactly one project.

This is a one-to-many relationship.

# Users and task assignments

A task can have multiple assigned users.

A user can be assigned to multiple tasks.

This is a many-to-many relationship represented through a TaskAssignment entity.

Only users who are members of the task's project may be assigned to that task.

# Task dependencies

A task can be blocked by multiple other tasks within the same project.

A task can also block multiple tasks.

This is a self-referencing many-to-many relationship represented through TaskDependency.

# Task history

A task can have multiple history events.

Each history event belongs to one task.

This is a one-to-many relationship.

# Comments

A task can have multiple comments.

Each comment belongs to one task and is created by one user.

Comments are part of the immutable task timeline.

# Alert dismissals

An overdue alert dismissal is associated with both a user and a task.

A user may dismiss alerts for multiple tasks, and a task may have alerts dismissed by multiple assigned users.

The exact representation will be finalized during implementation.


- Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

The database will handle basic constraints such as primary keys, foreign keys, and unique values. More complex rules, such as task status transitions, will be handled in Django.


- What did you deliberately denormalise?
- What would break first if this had 100x the data?


