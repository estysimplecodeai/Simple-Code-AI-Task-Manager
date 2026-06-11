# Simple Code AI — Task Manager

A standalone MERN task manager for the Simple Code AI development team. Two roles —
**Managing Engineer** and **Developer** — share one data layer and see role-specific
portals.

- **Managers** create projects (spaces), create tasks with locked deadlines, add
  developers to spaces, and approve/adjust/deny deadline-extension requests.
- **Developers** see only the spaces they belong to, work their assigned tasks
  (kanban board + list), and request deadline extensions with a note + proposed date.
- **Stale** tasks (past deadline, not done and not in review) surface automatically
  on dashboards — it's a derived state, computed live against the current date.

Built with: Express + Mongoose + JWT (backend), React + Vite + React Router (frontend).

---

## Prerequisites

- Node.js 18+ (developed on Node 24)
- A MongoDB connection string — either MongoDB Atlas / DigitalOcean Managed Mongo,
  or use the bundled in-memory server for offline demos (no DB required).

## Project layout

```
backend/    Express REST API (/api), Mongoose models, JWT auth, Jest tests
frontend/   React + Vite single-page app (Developer + Manager portals)
docs/       Design spec and implementation plan
design-reference/   The approved Claude Design prototype (visual source of truth)
```

---

## Backend setup

```bash
cd backend
npm install
cp .env.example .env        # then edit .env (see below)
npm run seed                # creates the manager account if none exists
npm start                   # API on http://localhost:4000
```

### Environment (`backend/.env`)

| Var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string (database `scai_tasks`). |
| `JWT_SECRET` | Secret for signing JWTs — set a long random string. |
| `JWT_EXPIRES` | Token lifetime (default `7d`). |
| `SEED_MANAGER_EMAIL` | Seeded manager login (default `esty@simplecodeai.com`). |
| `SEED_MANAGER_NAME` | Seeded manager display name. |
| `SEED_MANAGER_PASSWORD` | Seeded manager initial password — **change after first login**. |
| `PORT` | API port (default `4000`). |
| `CLIENT_URL` | Allowed CORS origin (default `http://localhost:5173`). |

`.env` is git-ignored. The repo ships only `.env.example`.

> **Security note:** if a live `MONGO_URI` was ever committed to git history, rotate
> that database password — removing the file from the working tree does not remove it
> from history.

### Offline / no-database mode

To run the whole stack without any external database (data is ephemeral, wiped on
exit — great for demos):

```bash
cd backend
npm run dev:memory          # spins up an in-memory MongoDB, seeds the manager, listens on :4000
```

### Tests

```bash
cd backend
npm test                    # 47 Jest + supertest tests (in-memory mongo, no network)
```

---

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api
npm run dev                 # app on http://localhost:5173 (proxies /api to :4000)
```

Production build: `npm run build` (output in `frontend/dist/`).

---

## First run

1. Start the backend (`npm start`, or `npm run dev:memory` for offline) and the
   frontend (`npm run dev`).
2. Open http://localhost:5173 and sign in as the seeded manager
   (`esty@simplecodeai.com` / your `SEED_MANAGER_PASSWORD`).
3. **Team → New developer:** create a developer (name + email). The app generates a
   one-time **invite link** — copy it and send it to the developer (no email is sent
   automatically).
4. The developer opens the invite link, **sets their own password**, and is logged in.
5. **Spaces:** create a space (project), then **Manage members** to add the developer.
6. **New task:** create a task in that space, assign it to the developer, and set a
   deadline (required, manager-only).
7. The developer now sees the space and task. They can change status and, from a task,
   **request a deadline extension** (new date + note). The request appears in the
   manager's **Extension requests** queue, where the manager can approve as-requested,
   approve with a different date, or deny — each with a reply note.

---

## Roles & permissions (enforced server-side)

| Action | Manager | Developer |
|---|---|---|
| Create project / task, set & edit deadlines | ✅ | ❌ |
| Add developers, manage space members | ✅ | ❌ |
| Decide extension requests | ✅ | ❌ |
| Change task status | ✅ (any) | ✅ (only tasks assigned to them; never the derived `stale` column) |
| Request a deadline extension | — | ✅ (on their assigned tasks) |
| Read tasks | all | only in spaces they're a member of |

## API summary (`/api`)

`POST /auth/login` · `GET /auth/me` · `GET /auth/invite/:token` ·
`POST /auth/accept-invite` · `POST /auth/change-password` ·
`GET|POST /users` · `PATCH /users/:id` ·
`GET|POST /projects` · `PATCH /projects/:id/members` ·
`GET /tasks` · `GET /tasks/:id` · `POST /tasks` · `PATCH /tasks/:id` ·
`PATCH /tasks/:id/status` · `POST /tasks/:id/extension` ·
`POST /tasks/:id/extension/decide`
