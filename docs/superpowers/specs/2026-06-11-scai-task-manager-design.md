# Simple Code AI — Task Manager (Design Spec)

_Date: 2026-06-11_

A standalone MERN task-management application for the Simple Code AI development
team. Two roles — **Managing Engineer** and **Developer** — share one data layer
and see role-specific portals. Recreates the approved Claude Design prototype
(light theme, SCAI teal accent) as a real full-stack app with JWT auth.

This is a standalone product. The original "multi-template CRM" idea (Bookkeeper,
SCAI, etc.) is explicitly **out of scope** — there is no template framework.

---

## 1. Goals

- Managers own tasks, deadlines, projects, team membership, and extension decisions.
- Developers see only the projects they belong to, work their assigned tasks, and
  request deadline extensions with a note + proposed date.
- "Stale" surfaces overdue work that isn't done or in review.
- Visuals match the approved prototype: white surfaces, near-black ink
  (`#0d1117`), SCAI teal accent (`#2eafb7`), Mona Sans + JetBrains Mono, real SCAI
  logo, spaces-first sidebar navigation.

## 2. Architecture

Monorepo inside the existing repo (`backend/` and `frontend/` already exist):

- **Backend** — Node + Express + Mongoose. JWT auth, bcrypt password hashing.
  Connects to the MongoDB Atlas instance in `backend/.env` (`MONGO_URI`).
- **Frontend** — React + Vite + React Router. Axios client with a JWT
  Authorization interceptor. Components recreate the prototype using the light
  theme tokens copied from the handoff bundle.
- The active portal (Developer vs. Manager) is chosen by the authenticated user's
  `role`. One app, two layouts.

```
Simple-Code-AI-Task-Manager/
  backend/
    src/
      models/      User.js  Project.js  Task.js
      routes/      auth.js  users.js  projects.js  tasks.js
      middleware/  auth.js  (requireAuth, requireManager)
      lib/         derive.js (isStale, daysLeft, columnOf), keys.js
      seed.js      app.js  server.js
    .env  .env.example  package.json
    tests/         auth.test.js  tasks.test.js  extensions.test.js
  frontend/
    src/
      api/         client.js  (axios + interceptor)
      auth/        AuthContext.jsx
      components/   ui/ (Sidebar, TopBar, StatusPill, PriorityTag, ProjectTag,
                        BranchTag, Btn, Modal, Field, Avatar, Panel, Stat, Toast,
                        EmptyState, Board, Column, TaskCard, ...)
      pages/       Login, AcceptInvite, manager/*, developer/*
      styles/      colors_and_type.css  scai-brand.css
      assets/      scai-logo.png
    index.html  vite.config.js  package.json
  docs/superpowers/specs/2026-06-11-scai-task-manager-design.md
```

## 3. Data model (Mongoose)

### User
| field | type | notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercased |
| passwordHash | String | null until invite accepted |
| role | enum `manager` \| `developer` | required |
| initials | String | derived from name if absent |
| title | String | e.g. "Backend Engineer" |
| status | enum `invited` \| `active` \| `disabled` | default `invited` |
| inviteToken | String | random, one-time; cleared on accept |
| inviteExpires | Date | token TTL (7 days) |
| createdBy | ref User | |
| timestamps | | |

### Project (Space)
| field | type | notes |
|---|---|---|
| name | String | required |
| key | String | unique, uppercase short code (e.g. `ATLAS`) |
| tone | enum `teal` \| `coral` \| `sand` | badge color |
| members | [ref User] | developers with access |
| nextNum | Number | per-project task counter, default 1 |
| createdBy | ref User | |

### Task
| field | type | notes |
|---|---|---|
| key | String | `<PROJECTKEY>-<n>`, generated on create |
| project | ref Project | required |
| title | String | required |
| desc | String | |
| assignee | ref User | must be a member of the project |
| priority | enum `low` \| `med` \| `high` | default `med` |
| status | enum `todo` \| `in_progress` \| `in_review` \| `done` | default `todo` |
| deadline | Date | **required**; manager-only to set/change |
| branch | String | GitHub branch |
| createdBy | ref User | |
| ext | subdoc \| null | extension request, see below |
| timestamps | | |

### Extension (embedded subdoc on Task, `ext`)
`{ state: 'pending'|'approved'|'denied', requestedDate, note, requestedAt,
   requestedBy (ref), originalDeadline, managerNote, decidedDate, decidedBy (ref),
   grantedDate }`

### Derived: `stale`
Never stored. Computed against the **real current date**:
`stale = deadline < today AND status ∉ { done, in_review }`.
`columnOf(task)` returns `stale` when stale, else the real status. Kanban shows
columns `todo · in_progress · in_review · stale · done`.

## 4. Auth & permissions (JWT)

- `POST /api/auth/login { email, password }` → `{ token, user }`. Token is a signed
  JWT (`JWT_SECRET`), stored client-side in `localStorage`, sent as
  `Authorization: Bearer <token>`.
- `GET /api/auth/me` → current user.
- **Invite flow** (developers set their own password):
  - Manager `POST /api/users { name, email, title }` → creates a `developer` in
    `invited` status with a random `inviteToken`; response returns the token + a
    ready-to-share invite path (`/accept-invite/<token>`). No email is sent — the
    manager shares the link manually.
  - `GET /api/auth/invite/:token` → validates token (and expiry), returns
    `{ name, email }` to prefill the page.
  - `POST /api/auth/accept-invite { token, password }` → sets `passwordHash`,
    flips status to `active`, clears the token, and returns `{ token, user }`
    (auto-login).
- `POST /api/auth/change-password { currentPassword, newPassword }` (any active user).
- **Public registration is closed.** The only manager is the seeded one; further
  accounts are manager-created.

### Permission rules (enforced server-side)
| Action | Manager | Developer |
|---|---|---|
| Create task / set or edit deadline | ✅ | ❌ |
| Edit any task field | ✅ | ❌ |
| Change task status | ✅ | ✅ only on tasks **assigned to them**, and never to/from `stale` (derived) |
| Request extension | ❌ (not needed) | ✅ on their assigned tasks |
| Decide extension (approve / adjust date / deny) | ✅ | ❌ |
| Create developer accounts / manage members | ✅ | ❌ |
| Read tasks | all | only in projects they're a member of |

## 5. API surface (prefix `/api`)

| Area | Endpoint | Auth |
|---|---|---|
| Auth | `POST /auth/login` | public |
| | `GET /auth/me` | auth |
| | `GET /auth/invite/:token` | public |
| | `POST /auth/accept-invite` | public |
| | `POST /auth/change-password` | auth |
| Team | `GET /users` | manager |
| | `POST /users` (create developer → returns invite link) | manager |
| | `PATCH /users/:id` (disable / re-enable / re-issue invite) | manager |
| Projects | `GET /projects` (scoped by role) | auth |
| | `POST /projects` | manager |
| | `PATCH /projects/:id/members` | manager |
| Tasks | `GET /tasks` (scoped: dev → member projects only; supports `?project=`) | auth |
| | `GET /tasks/:id` | auth (scoped) |
| | `POST /tasks` | manager |
| | `PATCH /tasks/:id/status { status }` | developer (own) or manager |
| | `PATCH /tasks/:id` (title, desc, assignee, priority, deadline, branch) | manager |
| Extensions | `POST /tasks/:id/extension { requestedDate, note }` | developer (own) |
| | `POST /tasks/:id/extension/decide { decision, newDate?, managerNote }` | manager |

`decision` ∈ `approve` (use requested date) \| `modify` (use `newDate`) \| `deny`.
Approve/modify move `task.deadline`; all three record `managerNote` + `decidedBy`
+ `decidedDate`.

Task list responses include a computed `stale` boolean and `daysLeft` so the
frontend doesn't re-derive date logic inconsistently.

## 6. Frontend screens

**Login** (`/login`) — SCAI-branded single login.
**Accept invite** (`/accept-invite/:token`) — prefilled name/email, set password, auto-login.

**Manager portal**
- Dashboard — stat tiles, "Stale Tasks" panel (red, overdue), pending extension queue, per-developer workload.
- Extension Requests — compact clickable checklist; expand a row → note + Approve / Adjust date / Deny with reply note.
- Stale Tasks — red-accented sortable table (worst-overdue first), ext-request chip, opens task detail.
- Spaces — space cards; open a space → Board / List sub-views; "Manage members" (add by email search over real developer accounts) + New Task.
- Team — list developers, create developer (generates invite link), disable/re-invite.
- New Task modal — project, title, desc, assignee (limited to project members), priority, deadline (required), branch.

**Developer portal**
- Dashboard — your stat tiles, your stale tasks (with Request-ext), extension request feed.
- Extension Requests — your request history with manager replies.
- Spaces (only ones you belong to) — each expands to Board / List.
- Board — 5-column kanban; drag to change status; deadline shown locked with "Set by <manager>"; Request-extension action. Stale column is read-only (derived); cards can't be dragged in/out of it.
- List — sortable table, group-by-assignee, density toggle.

Visual parity: light theme tokens, Mona Sans / JetBrains Mono, SCAI logo
(`mix-blend-mode: multiply` on the parchment sidebar), spaces-first sidebar,
status pills, priority diamonds, project key tags, branch tags, teal active nav.

## 7. Deviations from the prototype (intentional)

1. Real JWT login + invite flow replaces the demo account-switcher.
2. Real "today" drives stale logic (prototype hard-coded 2026-06-10).
3. Managers create developer accounts (invite link); developers set their own password.
4. No demo data — only the seeded `esty@simplecodeai.com` manager.
5. Dragging a card into/out of the Stale column is blocked (derived state).

## 8. Seeding & ops

- `backend/seed.js`: if no users exist, create `esty@simplecodeai.com` as an
  `active` manager with password from `SEED_MANAGER_PASSWORD`
  (default documented in `.env.example`; logs a "change me" warning if default used).
- `.env` is git-ignored (holds live Atlas credentials + secrets). `.env.example`
  documents `MONGO_URI`, `JWT_SECRET`, `SEED_MANAGER_PASSWORD`, `PORT`, `CLIENT_URL`.

## 9. Testing

- Backend (Jest + supertest): login + me; invite create→accept; task create is
  manager-only; developer can change status only on assigned tasks and not
  to/from stale; extension request→decide (approve uses requested date, modify
  uses newDate, deny leaves deadline); stale derivation against a fixed clock.
- Frontend: component render smoke test for Board/List + a manual UAT pass of the
  connected flow (dev requests extension → appears in manager queue → approval
  moves the deadline on the dev side).

## 10. Out of scope (v1)

Multi-template framework, email delivery, real-time websockets, task
comments/activity log, notifications, file attachments, audit log.
