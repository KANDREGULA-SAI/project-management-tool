# Schema

Answer each of these, in your own words.

- Table by table: what columns and types does each one have?
The application currently uses a custom Django User model.

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| username | String | Django username field |
| email | Email/String | Unique and used for login |
| password | String | Stored as a hashed password |
| first_name | String | Optional |
| last_name | String | Optional |
| role | String | Either `MANAGER` or `MEMBER` |
| is_active | Boolean | Django account status |
| is_staff | Boolean | Django admin access |

## Projects

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| key | String | Unique short project key |
| name | String | Project name |
| description | Text | Optional project description |
| owner | Foreign Key | Points to the user who owns the project |
| members | Many-to-Many | Users who belong to the project |
| is_archived | Boolean | Used to archive and restore projects |
| created_at | DateTime | Creation time |
| updated_at | DateTime | Last update time |

A project has one owner, but can have many members.

## Tasks

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| project | Foreign Key | Each task belongs to one project |
| title | String | Task title |
| description | Text | Task description |
| priority | String | `LOW`, `MEDIUM` or `HIGH` |
| status | String | Backlog, In Progress, In Review, Blocked or Done |
| previous_status | String | Stores the status before a task becomes blocked |
| due_date | DateTime | Optional due date |
| blocking_tasks | Many-to-Many | Other tasks that block this task |
| assignees | Many-to-Many | Users assigned to the task |
| created_by | Foreign Key | User who created the task |
| created_at | DateTime | Creation time |
| updated_at | DateTime | Last update time |

## Task History

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| task | Foreign Key | Task related to the history event |
| actor | Foreign Key | User who made the change |
| action | String | Created, Updated, Assigned, Unassigned or Commented |
| field | String | Field that was changed |
| old_value | Text | Previous value |
| new_value | Text | New value |
| comment | Text | Comment text when the event is a comment |
| created_at | DateTime | Time of the event |

History records are read-only and are used to keep an immutable timeline for each task.

## Task Alerts

| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary key |
| task | Foreign Key | Task that caused the alert |
| user | Foreign Key | Assigned user who receives the alert |
| dismissed | Boolean | Whether the user dismissed the alert |
| created_at | DateTime | Alert creation time |
| dismissed_at | DateTime | Time the alert was dismissed |

There is a unique constraint on the combination of task and user so that the same task does not create duplicate alerts for the same user.

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
The database currently handles rules such as:

- User email must be unique.
- Project key must be unique.
- A task alert for the same task and user can only exist once.
- Foreign key relationships are maintained by Django.




- What did you deliberately denormalise?
I did not deliberately denormalise the main task and project data.

I kept users, projects, tasks, assignments, history and alerts as separate related records so the data stays consistent and easier to update.

The actor_email and created_by_email values returned by the API are serializer fields rather than duplicated database columns.


- What would break first if this had 100x the data?


