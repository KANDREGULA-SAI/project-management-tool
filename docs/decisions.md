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


## Decision 1

# Backend: Django REST Framework

I chose Django and Django REST Framework for the backend. This project has authentication, roles, many database relationships, and server-side rules, so Django fits well.

## Decision 2

# Frontend: React + TypeScript + Vite

I chose React because the project needs multiple interactive pages such as dashboard, projects, tasks, and alerts.

I am using TypeScript for better type checking and Vite for a simple and fast setup.

## Decision 3

# Database: PostgreSQL

I chose PostgreSQL because this project has strongly related data such as users, projects, tasks, assignments, and dependencies.

I considered SQLite for simplicity, but PostgreSQL is more suitable for the deployed multi-user application.

## Decision 4

# Separate frontend and backend

I decided to keep React and Django as separate applications.

This makes the responsibility clear: React handles the UI, while Django handles authentication, permissions, validation, and business rules.
