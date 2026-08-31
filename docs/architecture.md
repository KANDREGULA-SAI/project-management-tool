# Architecture

Answer each of these, in your own words, once the system has taken real shape.

- What are the moving pieces, and how do they talk to each other?
- Where does each piece run?
- What is the request path for one representative user action, end to end?
- What did you decide *not* to build, and why?

# Initial architecture
The application has three main parts:

React Frontend
      |
Django REST API
      |
PostgreSQL Database

The React frontend will communicate with the Django backend using REST APIs. The backend will handle authentication, permissions, and business rules, while PostgreSQL will store the application data.

The frontend will run in the browser. The backend and database will be deployed separately.