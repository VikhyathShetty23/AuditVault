# AuditVault AI Development Rules

## General

Build AuditVault as a real student team project.

Do not generate unnecessary abstractions.
Do not add libraries unless there is a clear reason.
Prefer simple, readable JavaScript.
Do not over-engineer the application.

## Frontend

Use React + Vite.

The UI must be minimalistic, professional and consistent.

Do not use emojis anywhere in the UI.

Use SVG icons where icons are needed.

Avoid excessive animations, gradients, glassmorphism,
huge cards, excessive rounded corners, or decorative UI.

Do not make the application look like an AI-generated template.

Use sensible spacing, typography and hierarchy.

## Backend

Use Node.js + Express.

Keep routes, controllers, models and middleware separate.

Do not put the entire backend into server.js.

Do not duplicate audit logging logic inside controllers.

Audit logging must be handled through middleware.

## Database

Use MongoDB Atlas with Mongoose.

Collections:
- Users
- Memos
- AuditLogs

Never hardcode credentials.

Use environment variables.

Never commit .env.

## Security

Passwords must be hashed.

Protected resources must be authorized on the backend.

A user must not access another user's memo by changing a memo ID.

Audit logs must not have normal UPDATE or DELETE endpoints.

## Code Style

Prefer readable code over clever code.

Use descriptive variable names.

Do not add comments explaining obvious code.

Comments should explain non-obvious decisions.

Do not generate fake data unless explicitly requested.

Before changing existing code, inspect the relevant files.

After implementing a feature, run the relevant tests/build.