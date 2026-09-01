# AI prompts

The prompts you actually used, in the order you used them, grouped by what you were trying to achieve. For each significant one: what you asked, what you got back, and what you had to correct.

Include at least one prompt that produced something wrong, and what you did about it.

If you did not use AI at all, say so here, and describe your process instead.

## <What you were trying to achieve>

### Prompt

### What you got

### What you corrected

### <What I am trying to achieve>
Understand what the project requirements are asking for.

### Prompt
I received requirements for a project management application. Explain the scenario and requirements clearly before I start development.

### Outcome
I broke the project into the main required features and planned the development in phases.

### <What I am trying to achieve>
Choose a technology stack suitable for the application.

### Prompt
I want to use VS Code for project execution. For the backend, is Python and Django a good choice?

### Outcome
I decided to use:

React + TypeScript + Vite
Django + Django REST Framework
PostgreSQL

I chose this stack because the project has authentication, roles, relational data, and server-side business rules.

### <What I am trying to achieve>
Create a public repository and establish an incremental Git workflow.

### Prompt
Give me step-by-step instructions to create a project repository, add the required documentation, and make meaningful Git commits

### Outcome
I created the public repository and made the first commit before starting application development.

### <What I am trying to achieve>
Frontend setup

### Prompt
Next, we should start with creating the React frontend step by step. Give step-by-step instructions for this.

### Outcome
I created the frontend using React, TypeScript, and Vite. I ran the development server and verified that the default application was working.

### <What I am trying to achieve>
Backend setup

### Prompt
Give step-by-step instructions to create a Django backend.

### Outcome

I created a Django backend with a Python virtual environment and installed Django and Django REST Framework.
I created a simple API app and added a health endpoint to verify that the backend was running.

### <What I am trying to achieve>
Create a custom Django User model with Manager and Member roles.

### Prompts used
How do I create a custom User model in Django using email for login?
How do I add Manager and Member roles to the User model?
How do I configure AUTH_USER_MODEL?
How do I create and apply migrations for a custom User model?

## Issue encountered
After creating the custom User model, Django returned:
no such table: accounts_user

## What I changed
I checked the migration state, reset the local development database and recreated the accounts migration. After running migrations again, the accounts_user table was created successfully.

### <What I am trying to achieve>
Add authentication APIs for login and retrieving the current user.

### Prompts used
How do I implement JWT authentication in Django REST Framework?
How do I create login, token refresh and current user endpoints?
How do I test Django APIs using Thunder Client in VS Code?