# Architecture

Answer each of these, in your own words, once the system has taken real shape.

- What are the moving pieces, and how do they talk to each other?
The application has three main parts:

- **React + TypeScript frontend** – handles the UI and user interactions.
- **Django + Django REST Framework backend** – handles authentication, permissions, task/project logic and API requests.
- **Database** – SQLite is used during development to store users, projects, tasks, assignments, history and alerts. PostgreSQL is planned for production.

- Where does each piece run?
The React frontend runs in the browser during development using Vite.

The Django backend runs locally on the development server and exposes the REST API.

SQLite runs as the development database through Django.

For production, the frontend and backend will be deployed separately and PostgreSQL will be used instead of SQLite.

- What is the request path for one representative user action, end to end?
For example, when a manager creates a new task:

The manager fills in the task details in the React frontend.
The frontend sends a `POST` request to the Django task API.
The JWT token is sent with the request so the backend knows which user is making the request.
Django checks that the user is authenticated and has permission to create the task in the selected project.
The serializer validates the task data.
Django saves the task in the database.
The backend returns the created task as a JSON response.
The React frontend refreshes the task list and displays the new task.

- What did you decide *not* to build, and why?
I kept the implementation focused on the required features because of the limited time available for the assignment.

I did not add a separate background worker for alerts. Instead, overdue alerts are generated when the alerts API is requested. This keeps the implementation simpler while still providing the required alert behavior.

I also kept SQLite for development instead of setting up PostgreSQL locally. PostgreSQL is planned for production deployment.

The application currently focuses on the required project management features rather than adding optional stretch features before the core requirements are complete.

# Initial architecture
The application has three main parts:

React Frontend
      |
Django REST API
      |
PostgreSQL Database

The React frontend will communicate with the Django backend using REST APIs. The backend will handle authentication, permissions, and business rules, while PostgreSQL will store the application data.

The frontend will run in the browser. The backend and database will be deployed separately.

Authentication: JWT
Development database: SQLite
Planned production database: PostgreSQL