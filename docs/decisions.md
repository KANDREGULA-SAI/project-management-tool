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
