# AuditVault — Product Requirements Document

**Project Type:** Full-Stack Web Application
**Domain:** Information Security, Data Governance, Audit Logging
**Version:** 1.0
**Technology:** React, Vite, Node.js, Express.js, MongoDB Atlas
**Team Size:** 4

---

## 1. Product Overview

### 1.1 Product Name

**AuditVault**

### 1.2 Product Summary

AuditVault is a secure web-based memo management system designed to demonstrate how sensitive information can be managed while maintaining a reliable audit trail of user activity.

Users can create, view, update, and delete private memos. Every operation performed on a memo is automatically recorded in a separate audit log containing information such as the user, action performed, timestamp, and IP address.

The primary technical feature is an **Express.js audit middleware** that automatically records memo-related activity without requiring individual controllers to manually implement logging.

The project demonstrates concepts relevant to:

* Information security
* Data governance
* Accountability
* Auditability
* Backend middleware architecture
* Access control
* Database design
* Compliance-oriented application development

---

# 2. Problem Statement

Applications that handle sensitive information need to answer basic accountability questions:

* Who accessed a document?
* What action did they perform?
* When did they perform it?
* Which document was affected?
* From which IP address was the request made?

A conventional CRUD application may store the current state of a document but provide little information about how that state was reached.

AuditVault addresses this by maintaining a dedicated audit history alongside the application's primary data.

---

# 3. Product Goals

## Primary Goals

1. Allow authenticated users to securely manage personal memos.
2. Automatically record memo-related actions.
3. Provide a chronological audit trail for each memo.
4. Separate application data from audit data.
5. Demonstrate clean Express middleware architecture.
6. Implement appropriate authentication and authorization.
7. Maintain a minimal, professional user interface.
8. Produce a project that can be clearly demonstrated and explained during a technical presentation or viva.

## Secondary Goals

1. Provide useful filtering and searching of audit records.
2. Prevent normal application users from modifying audit records.
3. Provide basic security-oriented validation and error handling.
4. Keep the architecture extensible for future security features.

---

# 4. Non-Goals

The first version will **not** attempt to be a complete enterprise document-management platform.

The following are outside the initial scope:

* File/document upload
* Real-time collaboration
* End-to-end encryption of memo content
* Digital signatures
* Complex role-based enterprise administration
* Multi-organization tenancy
* Blockchain-based logging
* Advanced SIEM integration
* Email notification systems
* Mobile applications

These can be considered future extensions.

---

# 5. Target Users

## 5.1 Standard User

A user who wants to securely store and manage sensitive text-based information.

Capabilities:

* Register/login
* Create memos
* View own memos
* Edit own memos
* Delete own memos
* View audit history for accessible memos

## 5.2 Administrator / Auditor

An optional elevated role for demonstration purposes.

Capabilities may include:

* View system audit activity
* Filter audit records
* Investigate activity associated with a memo
* Review suspicious or unusual activity

The administrator role should be introduced only after the core user functionality is stable.

---

# 6. Core User Journey

```text
User
 |
 | Login
 v
Dashboard
 |
 +---- Create Memo
 |
 +---- View Memo
 |        |
 |        +---- Audit entry: READ
 |
 +---- Edit Memo
 |        |
 |        +---- Audit entry: UPDATE
 |
 +---- Delete Memo
          |
          +---- Audit entry: DELETE
```

For creation:

```text
Create Memo
     |
     v
Express Route
     |
     v
Authentication Middleware
     |
     v
Audit Middleware
     |
     +---- CREATE AuditLog
     |
     v
Memo Controller
     |
     v
MongoDB
```

The same architecture is used for the other memo operations.

---

# 7. Functional Requirements

## 7.1 Authentication

The system must provide authentication before users can access protected memo functionality.

### Requirements

* User registration
* User login
* Logout
* Password validation
* Protected API routes
* User identification on authenticated requests
* Unauthorized requests must be rejected

The initial implementation should use JWT-based authentication.

Firebase Authentication is not required for the first version.

---

# 8. Memo Management

## 8.1 Create Memo

Authenticated users must be able to create a memo.

### Required fields

* Title
* Content

### Automatically generated fields

* Owner ID
* Created timestamp
* Updated timestamp

Example:

```json
{
  "title": "Security Review",
  "content": "Confidential review information.",
  "ownerId": "user_id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 8.2 View Memo

Users must be able to open an individual memo.

Whenever an individual memo is successfully accessed, the system must create a corresponding `READ` audit entry.

---

## 8.3 Update Memo

Users must be able to edit their own memos.

A successful update must create an `UPDATE` audit entry.

---

## 8.4 Delete Memo

Users must be able to delete their own memos.

A successful deletion must create a `DELETE` audit entry.

The audit record should remain available after the memo is deleted so that the system retains evidence that the deletion occurred.

This means the relationship between deleted memos and audit records must be designed carefully rather than relying on cascading deletion.

---

# 9. Audit Logging

Audit logging is the defining feature of AuditVault.

Every supported memo operation must generate an audit record.

### Supported actions

```text
CREATE
READ
UPDATE
DELETE
```

### Audit record

```json
{
  "memoId": "memo_id",
  "actionType": "UPDATE",
  "timestamp": "2026-08-19T17:30:00.000Z",
  "userId": "user_id",
  "ipAddress": "client_ip"
}
```

---

# 10. Audit Middleware

The backend must use dedicated Express middleware to handle audit logging.

### Requirement

Memo routes should pass through the audit middleware before the relevant controller completes the operation.

Conceptually:

```text
Request
   |
   v
Authentication Middleware
   |
   v
Audit Middleware
   |
   v
Memo Controller
   |
   v
MongoDB
   |
   v
Response
```

The purpose is to avoid duplicating audit logic inside every controller.

For example, the memo controller should focus on:

```text
Create memo
```

rather than:

```text
Create memo
Create audit record
Determine IP
Determine user
Determine action
```

The audit middleware handles the cross-cutting logging responsibility.

---

# 11. Audit Trail

Each memo must have an accessible audit history.

Example:

```text
Audit Trail

Memo: Security Review

Timestamp            Action    User       IP Address
------------------------------------------------------
19 Aug 2026 10:15    CREATE    Vikhyath   103.x.x.x
19 Aug 2026 10:21    READ      Vikhyath   103.x.x.x
19 Aug 2026 10:42    UPDATE    Vikhyath   103.x.x.x
19 Aug 2026 11:03    READ      Admin      49.x.x.x
```

The audit trail should be displayed in reverse chronological order, with the newest event first.

---

# 12. Database Design

MongoDB Atlas will be used as the primary database.

## 12.1 Users Collection

```text
users
├── _id
├── name
├── email
├── passwordHash
├── role
└── createdAt
```

Passwords must never be stored in plain text.

---

## 12.2 Memos Collection

```text
memos
├── _id
├── title
├── content
├── ownerId
├── createdAt
└── updatedAt
```

`ownerId` references the user who owns the memo.

---

## 12.3 AuditLogs Collection

```text
auditLogs
├── _id
├── memoId
├── actionType
├── timestamp
├── userId
└── ipAddress
```

### Recommended indexes

```text
memoId
timestamp
userId
```

These will improve common audit-history queries.

---

# 13. API Requirements

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

## Memos

```text
GET    /api/memos
POST   /api/memos
GET    /api/memos/:id
PUT    /api/memos/:id
DELETE /api/memos/:id
```

## Audit

```text
GET /api/audit/:memoId
```

Optional administrator endpoint:

```text
GET /api/audit
```

---

# 14. Authorization

Authentication alone is not sufficient.

The backend must verify that a user has permission to access a memo.

For example:

```text
User A
  |
  +---- Memo A      Allowed
  |
  +---- Memo B      Denied
```

A user must not be able to bypass the frontend and access another user's memo simply by changing an ID in the API request.

Authorization checks must therefore be performed on the backend.

---

# 15. Frontend Requirements

The frontend should intentionally remain **minimalistic and professional**.

The interface should resemble a modern internal security or productivity application rather than a flashy student project.

## Design principles

* Clean layout
* Strong typography
* Generous spacing
* Restrained use of color
* Clear hierarchy
* Minimal animations
* Consistent buttons and forms
* Responsive layout
* Accessible contrast
* No unnecessary decorative elements

### Iconography

Do not use emojis as interface elements.

Where an icon is useful, use a consistent SVG icon set or simple inline SVG icons.

Examples:

```text
View       → eye SVG
Edit       → pencil SVG
Delete     → trash SVG
Audit      → history/clock SVG
Settings   → settings SVG
Logout     → logout SVG
```

Icons should support the interface rather than dominate it.

---

# 16. Frontend Pages

## 16.1 Login

Minimal form:

```text
AuditVault

Secure memo management with accountable access.

Email
[_____________________]

Password
[_____________________]

[ Sign In ]

Don't have an account? Create one
```

---

## 16.2 Dashboard

The dashboard should show:

* Total memos
* Recently updated memos
* Recently created memos
* Recent audit activity

Avoid excessive dashboard cards.

The dashboard should prioritize useful information rather than decorative statistics.

---

## 16.3 Memos

Main memo-management page.

Features:

* Search
* Create memo
* View memo
* Edit memo
* Delete memo

Example structure:

```text
Memos                              [New Memo]

Search memos...

------------------------------------------------
Security Review
Updated 19 Aug 2026
                         View  Edit  Delete
------------------------------------------------
Project Notes
Updated 18 Aug 2026
                         View  Edit  Delete
```

---

## 16.4 Memo Details

Display:

```text
Security Review

Created: 19 Aug 2026
Updated: 19 Aug 2026

--------------------------------
Memo content
--------------------------------

[ Edit ]    [ Audit History ]
```

---

## 16.5 Audit Trail

The audit page should focus on readability.

Filters may include:

* Memo
* Action
* User
* Date range

The table should contain:

```text
Timestamp
Action
Memo
User
IP Address
```

Use visual distinction for action types, but keep the overall design restrained.

---

# 17. Error Handling

The system should provide useful errors without exposing internal implementation details.

Examples:

```text
401
Authentication required.

403
You do not have permission to access this memo.

404
Memo not found.

500
Something went wrong. Please try again.
```

Backend errors should be logged for development purposes but sensitive stack traces must not be exposed to users.

---

# 18. Security Requirements

The project should demonstrate basic security best practices.

### Required

* Password hashing
* JWT authentication
* Protected routes
* Backend authorization
* Input validation
* Environment variables for secrets
* No credentials committed to Git
* Appropriate HTTP status codes
* CORS configuration
* Basic rate limiting where appropriate
* Sanitized error responses
* Audit records protected from normal modification

### Environment variables

```text
MONGODB_URI=
JWT_SECRET=
PORT=
CLIENT_URL=
```

`.env` must be included in `.gitignore`.

---

# 19. Audit Log Integrity

The initial implementation should treat audit logs as append-only from the application layer.

Normal users must not have:

```text
UPDATE /api/audit/...
DELETE /api/audit/...
```

operations.

The application should only create and read audit records.

### Future enhancement

A hash-chain mechanism can be introduced:

```text
Log 1
   |
   v
hash
   |
   v
Log 2
previousHash = Log 1 hash
   |
   v
hash
   |
   v
Log 3
previousHash = Log 2 hash
```

This can make unauthorized modification of historical logs detectable.

It should be considered an advanced feature rather than a dependency for the first working version.

---

# 20. Frontend Architecture

Recommended structure:

```text
client/
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MemoCard.jsx
│   │   ├── MemoForm.jsx
│   │   └── AuditTable.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Memos.jsx
│   │   ├── MemoDetails.jsx
│   │   └── AuditTrail.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
└── package.json
```

---

# 21. Backend Architecture

```text
server/
│
├── config/
│   └── db.js
│
├── models/
│   ├── User.js
│   ├── Memo.js
│   └── AuditLog.js
│
├── controllers/
│   ├── authController.js
│   ├── memoController.js
│   └── auditController.js
│
├── routes/
│   ├── authRoutes.js
│   ├── memoRoutes.js
│   └── auditRoutes.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── auditMiddleware.js
│   └── errorMiddleware.js
│
├── utils/
│   └── ...
│
├── server.js
└── package.json
```

The architecture should favor separation of responsibilities rather than placing everything in a single file.

---

# 22. Team Responsibilities

## Member 1 — Frontend

* React setup
* Layout
* Dashboard
* Memo pages
* Audit Trail UI
* API integration

## Member 2 — Backend

* Express setup
* API routes
* Controllers
* Memo CRUD
* Error handling

## Member 3 — Database & Audit

* MongoDB Atlas
* Mongoose schemas
* Database indexes
* Audit middleware
* Audit-log API
* Audit integrity

## Member 4 — Authentication, Testing & Integration

* Authentication
* Authorization
* API testing
* Security testing
* Integration
* Deployment
* Documentation

Responsibilities may overlap during integration, but each area should have a primary owner.

---

# 23. AI-Assisted Development Guidelines

AI should be used as a development assistant rather than as a replacement for understanding the system.

### Appropriate AI usage

* Explain unfamiliar concepts
* Generate initial implementations
* Debug errors
* Review code
* Identify security issues
* Generate test cases
* Improve accessibility
* Review API contracts
* Suggest edge cases
* Generate documentation

### Development rule

Every AI-generated feature must be:

```text
Generated
    ↓
Reviewed by team member
    ↓
Understood
    ↓
Tested
    ↓
Code reviewed
    ↓
Merged
```

Avoid asking AI to generate the entire project in one step.

The final codebase should use straightforward code that the team can understand and explain.

---

# 24. Git Workflow

The team should use a feature-branch workflow.

```text
main
│
├── feature/frontend
├── feature/memo-api
├── feature/audit-system
└── feature/auth
```

Recommended workflow:

```text
Pull latest main
      ↓
Create feature branch
      ↓
Implement small feature
      ↓
Test locally
      ↓
Commit
      ↓
Push branch
      ↓
Pull Request
      ↓
Team review
      ↓
Merge
```

No team member should directly push unfinished work to `main`.

---

# 25. Development Milestones

## Milestone 1 — Foundation

* Repository setup
* React/Vite setup
* Express setup
* MongoDB connection
* Environment configuration
* Base project structure

## Milestone 2 — Authentication

* Register
* Login
* JWT
* Protected routes
* Authorization

## Milestone 3 — Memo Management

* Create
* Read
* Update
* Delete
* Ownership validation

## Milestone 4 — Audit System

* AuditLog schema
* Audit middleware
* Automatic action detection
* User/IP/timestamp recording

## Milestone 5 — Audit Trail

* Audit API
* Audit table
* Filtering
* Chronological history

## Milestone 6 — Security & Polish

* Validation
* Error handling
* Security review
* Responsive UI
* Empty/loading states
* UI refinement

## Milestone 7 — Deployment & Presentation

* Production environment
* Frontend deployment
* Backend deployment
* MongoDB Atlas configuration
* Final testing
* Documentation
* Project demonstration

---

# 26. Acceptance Criteria

AuditVault will be considered functionally complete when:

### Authentication

* A user can register and log in.
* Protected routes reject unauthenticated requests.
* Users cannot access another user's memos.

### Memo Management

* Users can create memos.
* Users can view their memos.
* Users can update their memos.
* Users can delete their memos.

### Audit System

For every successful operation:

```text
CREATE → CREATE audit record
READ   → READ audit record
UPDATE → UPDATE audit record
DELETE → DELETE audit record
```

Each audit record must contain:

```text
memoId
actionType
timestamp
userId
ipAddress
```

### Audit Trail

* Users can view the history of an accessible memo.
* Entries are ordered by timestamp.
* Audit records remain available after a memo deletion where appropriate.
* Normal users cannot modify or delete audit records.

### UI

* Interface is responsive.
* No emojis are used as UI icons.
* SVG icons are used where appropriate.
* Visual design is minimal, consistent, and professional.
* Loading, empty, and error states are handled.

---

# 27. Testing Scenarios

The team should verify at minimum:

```text
User A creates Memo A
        ↓
CREATE log exists

User A views Memo A
        ↓
READ log exists

User A edits Memo A
        ↓
UPDATE log exists

User A deletes Memo A
        ↓
DELETE log exists

User B attempts to access Memo A
        ↓
Request rejected

User B attempts to modify Memo A
        ↓
Request rejected

User attempts to modify an audit log
        ↓
Request rejected
```

Additional testing should cover:

* Invalid login
* Expired/invalid JWT
* Invalid memo ID
* Missing title/content
* Empty memo content
* Duplicate registration
* Database connection failure
* Unauthorized API requests
* Malformed requests

---

# 28. Performance Considerations

The first version does not require complex optimization.

However:

* Index frequently queried audit fields.
* Paginate large audit histories.
* Avoid fetching unnecessary memo content when listing memos.
* Return only required fields where appropriate.
* Avoid loading the entire audit collection into the frontend.

For example:

```text
GET /api/audit/:memoId?page=1&limit=20
```

can be introduced when needed.

---

# 29. Future Enhancements

After the MVP is stable, the following features can be considered:

### Advanced audit integrity

* Hash-chained audit records
* Periodic audit snapshots
* External immutable storage

### Security monitoring

* Unusual IP detection
* Multiple-location access detection
* Repeated failed authentication detection
* Suspicious activity dashboard

### Enterprise features

* Admin dashboard
* Role-based access control
* Organization/workspace support
* Retention policies
* Exportable audit reports

### Document management

* File attachments
* Version history
* Document categories
* Tags
* Full-text search

These should not delay the core MVP.

---

# 30. MVP Definition

The minimum successful AuditVault consists of:

```text
React Frontend
      +
JWT Authentication
      +
Express REST API
      +
MongoDB Atlas
      +
Memo CRUD
      +
Audit Middleware
      +
AuditLogs Collection
      +
Audit Trail UI
```

The central demonstration should be:

```text
User creates memo
        ↓
Audit log automatically created

User views memo
        ↓
Audit log automatically created

User edits memo
        ↓
Audit log automatically created

User deletes memo
        ↓
Audit log automatically created
```

The user should never have to manually trigger the audit process.

---

# 31. Project Success Definition

AuditVault succeeds when it can convincingly demonstrate the following statement:

> **Every protected memo operation is accountable. The system records who performed the action, what action was performed, when it happened, which memo was affected, and the originating IP address, without requiring individual memo controllers to manually implement audit logging.**

The project should prioritize **correct architecture, security, reliability, and explainability** over excessive features.

The frontend should remain intentionally minimalistic so that the application's core security and audit functionality remains the focus.
