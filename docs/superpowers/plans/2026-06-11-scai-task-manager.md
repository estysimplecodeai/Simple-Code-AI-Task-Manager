# Simple Code AI Task Manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone MERN task manager for the Simple Code AI dev team — JWT auth, manager/developer roles, projects (spaces), tasks with locked deadlines, derived "stale" state, and a developer→manager extension-request flow — matching the approved light-theme prototype.

**Architecture:** Express + Mongoose REST API (`/api`) with JWT auth and server-side permission gates; React + Vite SPA that renders a Developer or Manager portal based on the authenticated user's role. The frontend ports the approved prototype in `design-reference/` verbatim for visuals, swapping its localStorage demo store for the real API.

**Tech Stack:** Node, Express, Mongoose, MongoDB Atlas, bcryptjs, jsonwebtoken, Jest + supertest + mongodb-memory-server (backend tests); React 18, Vite, React Router, axios, lucide-react (frontend).

**Design source of truth:** `design-reference/` (copied from the Claude Design handoff). Key files: `scai-ui.jsx` (shared components), `dev-views.jsx`, `dev-modals.jsx`, `mgr-views.jsx`, `mgr-modals.jsx`, `mgr-stale.jsx`, `scai-store.js` (data model + business logic), `scai-brand.css`, `colors_and_type.css`, `assets/scai-logo.png`. **Read the relevant reference file before porting each view.**

**Spec:** `docs/superpowers/specs/2026-06-11-scai-task-manager-design.md`.

**Conventions for every task:** exact paths below; commit after each task passes; backend commits `feat(api): …`, frontend `feat(ui): …`, chore/scaffold `chore: …`. Work on the `develop` branch.

---

## File structure

```
backend/
  .env                 (exists; holds MONGO_URI — add JWT_SECRET, etc.)
  .env.example
  package.json
  jest.config.js
  src/
    app.js             Express app (no listen) — importable by tests
    server.js          connects Mongo + listens
    db.js              mongoose connection helper
    config.js          env loading + defaults
    models/
      User.js
      Project.js
      Task.js
    middleware/
      auth.js          requireAuth, requireManager
      error.js         async wrapper + error handler
    lib/
      derive.js        isStale, daysLeft, columnOf, withDerived
      password.js      hash, compare
      token.js         signJwt, verifyJwt, randomToken
    routes/
      auth.js
      users.js
      projects.js
      tasks.js
    seed.js            create seeded manager if no users
  tests/
    helpers.js         in-memory mongo + app + auth helpers
    auth.test.js
    users.test.js
    projects.test.js
    tasks.test.js
    extensions.test.js
    derive.test.js

frontend/
  index.html
  package.json
  vite.config.js
  .env.example
  src/
    main.jsx
    App.jsx            router + auth gate
    api/client.js      axios instance + interceptor
    api/endpoints.js   thin wrappers (auth, users, projects, tasks)
    auth/AuthContext.jsx
    auth/useAuth.js
    lib/derive.js      isStale/daysLeft/columnOf (mirror of backend)
    lib/format.js      fmtDate, fmtShort, deadlinePhrase, addDays, initialsOf
    styles/colors_and_type.css   (copied from design-reference)
    styles/scai-brand.css        (copied from design-reference)
    assets/scai-logo.png         (copied from design-reference/assets)
    components/ui/     (ported from scai-ui.jsx, one file per component group)
      icons.jsx Avatar.jsx pills.jsx Btn.jsx Modal.jsx fields.jsx
      Sidebar.jsx TopBar.jsx Toast.jsx EmptyState.jsx Panel.jsx misc.jsx
    components/board/  Board.jsx Column.jsx TaskCard.jsx
    components/task/   TaskDetailModal.jsx ExtensionRequestModal.jsx
    pages/
      Login.jsx
      AcceptInvite.jsx
      manager/ ManagerApp.jsx Dashboard.jsx Approvals.jsx StaleTasks.jsx
               SpaceView.jsx Team.jsx CreateTaskModal.jsx ManageMembersModal.jsx
      developer/ DeveloperApp.jsx Dashboard.jsx Approvals.jsx SpaceView.jsx
```

---

# PHASE 0 — Scaffolding

### Task 0.1: Repo hygiene & gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.env
*.log
dist/
coverage/
.DS_Store
```

- [ ] **Step 2: Verify `.env` is now ignored**

Run: `git status --porcelain backend/.env`
Expected: no output (ignored). If `backend/.env` does not yet exist, that's fine — it's created in Task 0.2.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore (ignore .env, node_modules, build output)"
```

### Task 0.2: Backend project init

**Files:**
- Create: `backend/package.json`, `backend/.env.example`, `backend/jest.config.js`
- Modify: `backend/.env` (move the existing `MONGO_URI` here; add secrets)

- [ ] **Step 1: Init backend package**

Run from `backend/`:
```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install -D jest supertest mongodb-memory-server cross-env
```

- [ ] **Step 2: Write `backend/package.json` scripts** (merge into the generated file)

```json
{
  "name": "scai-task-manager-backend",
  "version": "1.0.0",
  "type": "commonjs",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "seed": "node src/seed.js",
    "test": "cross-env NODE_ENV=test jest --runInBand"
  }
}
```

- [ ] **Step 3: Write `backend/jest.config.js`**

```js
module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
};
```

- [ ] **Step 4: Ensure `backend/.env`** contains (the `MONGO_URI` already exists in the repo root `.env`; the live value must live in `backend/.env`):

```
MONGO_URI=mongodb+srv://Esty:7bp8T514v632dqHB@db-mdb-nyc1-93577-0e0a7f6f.mongo.ondigitalocean.com/scai_tasks?tls=true&authSource=admin&replicaSet=db-mdb-nyc1-93577
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES=7d
SEED_MANAGER_EMAIL=esty@simplecodeai.com
SEED_MANAGER_NAME=Esty
SEED_MANAGER_PASSWORD=ChangeMe!2026
PORT=4000
CLIENT_URL=http://localhost:5173
```

Note: database name changed from `test` to `scai_tasks` in the URI.

- [ ] **Step 5: Write `backend/.env.example`** (same keys, secrets redacted)

```
MONGO_URI=mongodb+srv://USER:PASS@HOST/scai_tasks?tls=true&authSource=admin
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES=7d
SEED_MANAGER_EMAIL=esty@simplecodeai.com
SEED_MANAGER_NAME=Esty
SEED_MANAGER_PASSWORD=ChangeMe!2026
PORT=4000
CLIENT_URL=http://localhost:5173
```

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/jest.config.js backend/.env.example
git commit -m "chore: init backend (express, mongoose, jwt, jest)"
```

### Task 0.3: Frontend project init

**Files:**
- Create: `frontend/` Vite React app, `frontend/.env.example`

- [ ] **Step 1: Scaffold Vite React app** (run from `frontend/`; scaffold into the current dir)

```bash
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios lucide-react
```

- [ ] **Step 2: Write `frontend/.env.example`**

```
VITE_API_URL=http://localhost:4000/api
```
Also create `frontend/.env` with the same line.

- [ ] **Step 3: Configure dev proxy in `frontend/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:4000" },
  },
});
```

- [ ] **Step 4: Copy design assets into the app**

```bash
cp "../design-reference/scai-brand.css" src/styles/scai-brand.css
cp "../design-reference/colors_and_type.css" src/styles/colors_and_type.css
mkdir -p src/assets && cp "../design-reference/assets/scai-logo.png" src/assets/scai-logo.png
```
(Create `src/styles/` first if needed.)

- [ ] **Step 5: Verify it boots**

Run: `npm run dev` then stop it. Expected: Vite serves on 5173 with no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend
git commit -m "chore: init frontend (vite react, router, axios, lucide)"
```

---

# PHASE 1 — Backend

> All backend tests use `backend/tests/helpers.js` (Task 1.1) which spins up an in-memory Mongo, builds the Express app, and provides login helpers. Run a single test file with: `cd backend && npx cross-env NODE_ENV=test npx jest tests/<file> --runInBand`.

### Task 1.1: Config, DB, app shell, test harness

**Files:**
- Create: `backend/src/config.js`, `backend/src/db.js`, `backend/src/app.js`, `backend/src/server.js`, `backend/src/middleware/error.js`, `backend/tests/helpers.js`

- [ ] **Step 1: Write `backend/src/config.js`**

```js
require("dotenv").config();

const config = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  seedManager: {
    email: (process.env.SEED_MANAGER_EMAIL || "esty@simplecodeai.com").toLowerCase(),
    name: process.env.SEED_MANAGER_NAME || "Esty",
    password: process.env.SEED_MANAGER_PASSWORD || "ChangeMe!2026",
  },
  inviteTtlDays: 7,
};

module.exports = config;
```

- [ ] **Step 2: Write `backend/src/db.js`**

```js
const mongoose = require("mongoose");
const config = require("./config");

async function connectDb(uri = config.mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDb };
```

- [ ] **Step 3: Write `backend/src/middleware/error.js`**

```js
// Wrap async route handlers so thrown errors hit the error handler.
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Throw this for expected, client-facing failures.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Server error" });
}

module.exports = { asyncH, HttpError, errorHandler };
```

- [ ] **Step 4: Write `backend/src/app.js`** (routes are mounted in later tasks; start minimal)

```js
const express = require("express");
const cors = require("cors");
const config = require("./config");
const { errorHandler } = require("./middleware/error");

function buildApp() {
  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // ROUTES MOUNTED HERE (auth, users, projects, tasks) in later tasks.

  app.use(errorHandler);
  return app;
}

module.exports = { buildApp };
```

- [ ] **Step 5: Write `backend/src/server.js`**

```js
const { buildApp } = require("./app");
const { connectDb } = require("./db");
const config = require("./config");

async function main() {
  await connectDb();
  const app = buildApp();
  app.listen(config.port, () => console.log(`API on :${config.port}`));
}

main().catch((e) => {
  console.error("Failed to start:", e);
  process.exit(1);
});
```

- [ ] **Step 6: Write `backend/tests/helpers.js`**

```js
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const { buildApp } = require("../src/app");

let mongod;

async function setupDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function teardownDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) await collections[key].deleteMany({});
}

function api() {
  return request(buildApp());
}

// Returns { token, user }. Creates the user directly via the model.
async function makeUser({ role = "developer", email, name = "Test User", password = "pw123456" } = {}) {
  const User = require("../src/models/User");
  const { hash } = require("../src/lib/password");
  const u = await User.create({
    name, email: email || `${role}_${Date.now()}@test.com`,
    role, status: "active", passwordHash: await hash(password),
  });
  const { signJwt } = require("../src/lib/token");
  return { user: u, token: signJwt({ sub: u.id, role: u.role }) };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { setupDb, teardownDb, clearDb, api, makeUser, auth };
```

- [ ] **Step 7: Smoke-test the harness** — create `backend/tests/health.test.js`

```js
const { setupDb, teardownDb, clearDb, api } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("GET /api/health returns ok", async () => {
  const res = await api().get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
```

- [ ] **Step 8: Run it**

Run: `cd backend && npx cross-env NODE_ENV=test npx jest tests/health.test.js --runInBand`
Expected: 1 passing test. (It imports `lib/password` and `lib/token` lazily inside helpers, so this test passes even before those exist — `makeUser` isn't called here.)

- [ ] **Step 9: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(api): app shell, config, db, error middleware, test harness"
```

### Task 1.2: Password & token libs

**Files:**
- Create: `backend/src/lib/password.js`, `backend/src/lib/token.js`
- Test: `backend/tests/lib.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/lib.test.js`

```js
const { hash, compare } = require("../src/lib/password");
const { signJwt, verifyJwt, randomToken } = require("../src/lib/token");

test("hash/compare round-trips", async () => {
  const h = await hash("secret123");
  expect(h).not.toBe("secret123");
  expect(await compare("secret123", h)).toBe(true);
  expect(await compare("wrong", h)).toBe(false);
});

test("jwt sign/verify round-trips", () => {
  const t = signJwt({ sub: "abc", role: "manager" });
  const decoded = verifyJwt(t);
  expect(decoded.sub).toBe("abc");
  expect(decoded.role).toBe("manager");
});

test("randomToken is unique and url-safe", () => {
  const a = randomToken(), b = randomToken();
  expect(a).not.toBe(b);
  expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/lib.test.js --runInBand`
Expected: FAIL — cannot find module `lib/password`.

- [ ] **Step 3: Write `backend/src/lib/password.js`**

```js
const bcrypt = require("bcryptjs");
const hash = (plain) => bcrypt.hash(plain, 10);
const compare = (plain, h) => bcrypt.compare(plain, h);
module.exports = { hash, compare };
```

- [ ] **Step 4: Write `backend/src/lib/token.js`**

```js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config");

const signJwt = (payload) => jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpires });
const verifyJwt = (token) => jwt.verify(token, config.jwtSecret);
const randomToken = () => crypto.randomBytes(24).toString("base64url");

module.exports = { signJwt, verifyJwt, randomToken };
```

- [ ] **Step 5: Run to verify pass**

Run: `cd backend && npx jest tests/lib.test.js --runInBand`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib backend/tests/lib.test.js
git commit -m "feat(api): password hashing and jwt/token helpers"
```

### Task 1.3: Models (User, Project, Task)

**Files:**
- Create: `backend/src/models/User.js`, `backend/src/models/Project.js`, `backend/src/models/Task.js`
- Test: `backend/tests/models.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/models.test.js`

```js
const { setupDb, teardownDb, clearDb } = require("./helpers");
const User = require("../src/models/User");
const Project = require("../src/models/Project");
const Task = require("../src/models/Task");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("User derives initials from name and lowercases email", async () => {
  const u = await User.create({ name: "Elena Lopez", email: "Elena@X.com", role: "developer" });
  expect(u.initials).toBe("EL");
  expect(u.email).toBe("elena@x.com");
  expect(u.status).toBe("invited");
});

test("User email is unique", async () => {
  await User.create({ name: "A B", email: "dup@x.com", role: "developer" });
  await expect(User.create({ name: "C D", email: "dup@x.com", role: "developer" }))
    .rejects.toThrow();
});

test("Project requires unique uppercase key", async () => {
  const p = await Project.create({ name: "Core API", key: "api" });
  expect(p.key).toBe("API");
  expect(p.nextNum).toBe(1);
});

test("Task requires a deadline and defaults status/priority", async () => {
  const p = await Project.create({ name: "Atlas", key: "ATLAS" });
  await expect(Task.create({ project: p._id, title: "no deadline" })).rejects.toThrow();
  const t = await Task.create({ project: p._id, title: "ok", deadline: new Date("2026-06-20") });
  expect(t.status).toBe("todo");
  expect(t.priority).toBe("med");
  expect(t.ext).toBeNull();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/models.test.js --runInBand`
Expected: FAIL — cannot find module `models/User`.

- [ ] **Step 3: Write `backend/src/models/User.js`**

```js
const mongoose = require("mongoose");

function initialsOf(name) {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ["manager", "developer"], required: true },
    initials: { type: String },
    title: { type: String, default: "" },
    status: { type: String, enum: ["invited", "active", "disabled"], default: "invited" },
    inviteToken: { type: String, default: null },
    inviteExpires: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  if (!this.initials && this.name) this.initials = initialsOf(this.name);
  next();
});

userSchema.methods.publicJson = function () {
  return {
    id: this.id, name: this.name, email: this.email, role: this.role,
    initials: this.initials, title: this.title, status: this.status,
  };
};

userSchema.statics.initialsOf = initialsOf;
module.exports = mongoose.model("User", userSchema);
```

- [ ] **Step 4: Write `backend/src/models/Project.js`**

```js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tone: { type: String, enum: ["teal", "coral", "sand"], default: "teal" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    nextNum: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
```

- [ ] **Step 5: Write `backend/src/models/Task.js`**

```js
const mongoose = require("mongoose");

const extSchema = new mongoose.Schema(
  {
    state: { type: String, enum: ["pending", "approved", "denied"], required: true },
    requestedDate: { type: Date, required: true },
    note: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    originalDeadline: { type: Date },
    managerNote: { type: String, default: "" },
    decidedDate: { type: Date, default: null },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    grantedDate: { type: Date, default: null },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    desc: { type: String, default: "" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    priority: { type: String, enum: ["low", "med", "high"], default: "med" },
    status: { type: String, enum: ["todo", "in_progress", "in_review", "done"], default: "todo" },
    deadline: { type: Date, required: true },
    branch: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ext: { type: extSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
```

- [ ] **Step 6: Run to verify pass**

Run: `cd backend && npx jest tests/models.test.js --runInBand`
Expected: 4 passing. (Unique-index tests require the index built; mongodb-memory-server builds indexes on `create`. If the unique test is flaky, add `await User.init()` / `await Project.init()` at the top of those tests.)

- [ ] **Step 7: Commit**

```bash
git add backend/src/models backend/tests/models.test.js
git commit -m "feat(api): User, Project, Task models"
```

### Task 1.4: Derive helpers (stale logic)

**Files:**
- Create: `backend/src/lib/derive.js`
- Test: `backend/tests/derive.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/derive.test.js`

```js
const { isStale, daysLeft, columnOf } = require("../src/lib/derive");

const today = new Date("2026-06-10T00:00:00Z");
const mk = (status, deadline) => ({ status, deadline: new Date(deadline + "T00:00:00Z") });

test("overdue + not done/review => stale", () => {
  expect(isStale(mk("todo", "2026-06-05"), today)).toBe(true);
  expect(isStale(mk("in_progress", "2026-06-09"), today)).toBe(true);
});

test("done or in_review never stale even if overdue", () => {
  expect(isStale(mk("done", "2026-06-01"), today)).toBe(false);
  expect(isStale(mk("in_review", "2026-06-01"), today)).toBe(false);
});

test("future or today deadline not stale", () => {
  expect(isStale(mk("todo", "2026-06-10"), today)).toBe(false);
  expect(isStale(mk("todo", "2026-06-15"), today)).toBe(false);
});

test("daysLeft negative when overdue", () => {
  expect(daysLeft(mk("todo", "2026-06-15"), today)).toBe(5);
  expect(daysLeft(mk("todo", "2026-06-05"), today)).toBe(-5);
});

test("columnOf returns stale when stale else status", () => {
  expect(columnOf(mk("todo", "2026-06-05"), today)).toBe("stale");
  expect(columnOf(mk("in_review", "2026-06-05"), today)).toBe("in_review");
  expect(columnOf(mk("todo", "2026-06-20"), today)).toBe("todo");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/derive.test.js --runInBand`
Expected: FAIL — cannot find module `lib/derive`.

- [ ] **Step 3: Write `backend/src/lib/derive.js`**

```js
const DAY = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

// Whole days from `now` to `deadline`. Negative = overdue.
function daysLeft(task, now = new Date()) {
  return Math.round((startOfDay(task.deadline) - startOfDay(now)) / DAY);
}

// Stale = deadline passed AND status is not done and not in review.
function isStale(task, now = new Date()) {
  if (task.status === "done" || task.status === "in_review") return false;
  return daysLeft(task, now) < 0;
}

function columnOf(task, now = new Date()) {
  return isStale(task, now) ? "stale" : task.status;
}

// Attach derived fields to a plain task object for API responses.
function withDerived(taskObj, now = new Date()) {
  return { ...taskObj, stale: isStale(taskObj, now), daysLeft: daysLeft(taskObj, now), column: columnOf(taskObj, now) };
}

module.exports = { isStale, daysLeft, columnOf, withDerived };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && npx jest tests/derive.test.js --runInBand`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/derive.js backend/tests/derive.test.js
git commit -m "feat(api): stale/daysLeft derive helpers"
```

### Task 1.5: Auth middleware

**Files:**
- Create: `backend/src/middleware/auth.js`
- Test: covered indirectly by route tests; add `backend/tests/middleware.test.js`

- [ ] **Step 1: Write `backend/src/middleware/auth.js`**

```js
const User = require("../models/User");
const { verifyJwt } = require("../lib/token");
const { asyncH, HttpError } = require("./error");

const requireAuth = asyncH(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Authentication required");
  let decoded;
  try { decoded = verifyJwt(token); } catch { throw new HttpError(401, "Invalid or expired token"); }
  const user = await User.findById(decoded.sub);
  if (!user || user.status === "disabled") throw new HttpError(401, "Account not available");
  req.user = user;
  next();
});

function requireManager(req, res, next) {
  if (!req.user || req.user.role !== "manager") return next(new HttpError(403, "Manager access required"));
  next();
}

module.exports = { requireAuth, requireManager };
```

- [ ] **Step 2: Write `backend/tests/middleware.test.js`**

```js
const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

// A throwaway protected route is mounted via the real app in Task 1.6+ (auth/me).
test("rejects missing token on /api/auth/me", async () => {
  const res = await api().get("/api/auth/me");
  expect(res.status).toBe(401);
});

test("accepts valid token on /api/auth/me", async () => {
  const { token, user } = await makeUser({ role: "manager", email: "m@x.com" });
  const res = await api().get("/api/auth/me").set(auth(token));
  expect(res.status).toBe(200);
  expect(res.body.user.email).toBe("m@x.com");
});
```

This test depends on the `/api/auth/me` route from Task 1.6 — it will fail until then. That's expected; mark this test file complete after Task 1.6.

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/auth.js backend/tests/middleware.test.js
git commit -m "feat(api): requireAuth and requireManager middleware"
```

### Task 1.6: Auth routes (login, me, invite accept, change password)

**Files:**
- Create: `backend/src/routes/auth.js`
- Modify: `backend/src/app.js` (mount `/api/auth`)
- Test: `backend/tests/auth.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/auth.test.js`

```js
const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");
const User = require("../src/models/User");
const { hash } = require("../src/lib/password");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("login succeeds with correct password and returns token + user", async () => {
  await User.create({ name: "Esty", email: "esty@x.com", role: "manager", status: "active", passwordHash: await hash("pw123456") });
  const res = await api().post("/api/auth/login").send({ email: "esty@x.com", password: "pw123456" });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user.role).toBe("manager");
});

test("login fails with wrong password", async () => {
  await User.create({ name: "Esty", email: "esty@x.com", role: "manager", status: "active", passwordHash: await hash("pw123456") });
  const res = await api().post("/api/auth/login").send({ email: "esty@x.com", password: "nope" });
  expect(res.status).toBe(401);
});

test("invited user cannot log in until accept", async () => {
  await User.create({ name: "Dev", email: "dev@x.com", role: "developer", status: "invited", inviteToken: "tok123", inviteExpires: new Date(Date.now() + 1e9) });
  const login = await api().post("/api/auth/login").send({ email: "dev@x.com", password: "whatever" });
  expect(login.status).toBe(401);

  const info = await api().get("/api/auth/invite/tok123");
  expect(info.status).toBe(200);
  expect(info.body.email).toBe("dev@x.com");

  const accept = await api().post("/api/auth/accept-invite").send({ token: "tok123", password: "newpass123" });
  expect(accept.status).toBe(200);
  expect(accept.body.token).toBeTruthy();

  const relogin = await api().post("/api/auth/login").send({ email: "dev@x.com", password: "newpass123" });
  expect(relogin.status).toBe(200);
});

test("change-password updates the hash", async () => {
  const { token } = await makeUser({ role: "developer", email: "d@x.com", password: "oldpass123" });
  const res = await api().post("/api/auth/change-password").set(auth(token))
    .send({ currentPassword: "oldpass123", newPassword: "brandnew123" });
  expect(res.status).toBe(200);
  const relogin = await api().post("/api/auth/login").send({ email: "d@x.com", password: "brandnew123" });
  expect(relogin.status).toBe(200);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/auth.test.js --runInBand`
Expected: FAIL (404s — routes not mounted).

- [ ] **Step 3: Write `backend/src/routes/auth.js`**

```js
const router = require("express").Router();
const User = require("../models/User");
const { hash, compare } = require("../lib/password");
const { signJwt } = require("../lib/token");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth } = require("../middleware/auth");

const issue = (user) => ({ token: signJwt({ sub: user.id, role: user.role }), user: user.publicJson() });

router.post("/login", asyncH(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user || user.status !== "active" || !user.passwordHash) throw new HttpError(401, "Invalid credentials");
  if (!(await compare(password || "", user.passwordHash))) throw new HttpError(401, "Invalid credentials");
  res.json(issue(user));
}));

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user.publicJson() }));

router.get("/invite/:token", asyncH(async (req, res) => {
  const user = await User.findOne({ inviteToken: req.params.token });
  if (!user || user.status !== "invited") throw new HttpError(404, "Invite not found");
  if (user.inviteExpires && user.inviteExpires < new Date()) throw new HttpError(410, "Invite expired");
  res.json({ name: user.name, email: user.email });
}));

router.post("/accept-invite", asyncH(async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  const user = await User.findOne({ inviteToken: token });
  if (!user || user.status !== "invited") throw new HttpError(404, "Invite not found");
  if (user.inviteExpires && user.inviteExpires < new Date()) throw new HttpError(410, "Invite expired");
  user.passwordHash = await hash(password);
  user.status = "active";
  user.inviteToken = null;
  user.inviteExpires = null;
  await user.save();
  res.json(issue(user));
}));

router.post("/change-password", requireAuth, asyncH(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) throw new HttpError(400, "New password must be at least 8 characters");
  if (!(await compare(currentPassword || "", req.user.passwordHash || ""))) throw new HttpError(400, "Current password is incorrect");
  req.user.passwordHash = await hash(newPassword);
  await req.user.save();
  res.json({ ok: true });
}));

module.exports = router;
```

- [ ] **Step 4: Mount in `backend/src/app.js`** — replace the `// ROUTES MOUNTED HERE` line with:

```js
  app.use("/api/auth", require("./routes/auth"));
```

- [ ] **Step 5: Run auth + middleware tests**

Run: `cd backend && npx jest tests/auth.test.js tests/middleware.test.js --runInBand`
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/auth.js backend/src/app.js backend/tests/auth.test.js
git commit -m "feat(api): auth routes (login, me, invite accept, change-password)"
```

### Task 1.7: Users routes (team management + invites)

**Files:**
- Create: `backend/src/routes/users.js`
- Modify: `backend/src/app.js`
- Test: `backend/tests/users.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/users.test.js`

```js
const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("manager creates a developer and gets an invite link", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  const res = await api().post("/api/users").set(auth(token))
    .send({ name: "Ravi Adeyemi", email: "ravi@simplecodeai.com", title: "Backend Engineer" });
  expect(res.status).toBe(201);
  expect(res.body.user.role).toBe("developer");
  expect(res.body.user.status).toBe("invited");
  expect(res.body.inviteToken).toBeTruthy();
  expect(res.body.invitePath).toContain("/accept-invite/");
});

test("developer cannot create users", async () => {
  const { token } = await makeUser({ role: "developer", email: "d@x.com" });
  const res = await api().post("/api/users").set(auth(token)).send({ name: "X", email: "x@x.com" });
  expect(res.status).toBe(403);
});

test("manager lists users", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  await api().post("/api/users").set(auth(token)).send({ name: "A B", email: "a@x.com" });
  const res = await api().get("/api/users").set(auth(token));
  expect(res.status).toBe(200);
  expect(res.body.users.length).toBeGreaterThanOrEqual(2); // manager + new dev
});

test("creating a duplicate email fails", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  await api().post("/api/users").set(auth(token)).send({ name: "A", email: "a@x.com" });
  const res = await api().post("/api/users").set(auth(token)).send({ name: "B", email: "a@x.com" });
  expect(res.status).toBe(409);
});

test("manager can re-issue an invite", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  const created = await api().post("/api/users").set(auth(token)).send({ name: "A", email: "a@x.com" });
  const id = created.body.user.id;
  const res = await api().patch(`/api/users/${id}`).set(auth(token)).send({ action: "reinvite" });
  expect(res.status).toBe(200);
  expect(res.body.inviteToken).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/users.test.js --runInBand`
Expected: FAIL (404s).

- [ ] **Step 3: Write `backend/src/routes/users.js`**

```js
const router = require("express").Router();
const User = require("../models/User");
const Project = require("../models/Project");
const { randomToken } = require("../lib/token");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth, requireManager } = require("../middleware/auth");
const config = require("../config");

router.use(requireAuth);

// List all users (manager only) — for team & member pickers.
router.get("/", requireManager, asyncH(async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map((u) => u.publicJson()) });
}));

function inviteFields() {
  const inviteToken = randomToken();
  const inviteExpires = new Date(Date.now() + config.inviteTtlDays * 86400000);
  return { inviteToken, inviteExpires };
}

// Create a developer in invited state; return the shareable invite link.
router.post("/", requireManager, asyncH(async (req, res) => {
  const { name, email, title } = req.body;
  if (!name || !email) throw new HttpError(400, "Name and email are required");
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new HttpError(409, "A user with that email already exists");
  const { inviteToken, inviteExpires } = inviteFields();
  const user = await User.create({
    name, email, title: title || "", role: "developer", status: "invited",
    inviteToken, inviteExpires, createdBy: req.user.id,
  });
  res.status(201).json({ user: user.publicJson(), inviteToken, invitePath: `/accept-invite/${inviteToken}` });
}));

// Disable / enable / reinvite.
router.patch("/:id", requireManager, asyncH(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  const { action } = req.body;
  if (action === "disable") user.status = "disabled";
  else if (action === "enable") user.status = user.passwordHash ? "active" : "invited";
  else if (action === "reinvite") {
    const f = inviteFields();
    user.inviteToken = f.inviteToken; user.inviteExpires = f.inviteExpires;
    user.status = "invited"; user.passwordHash = null;
  } else throw new HttpError(400, "Unknown action");
  await user.save();
  const out = { user: user.publicJson() };
  if (action === "reinvite") { out.inviteToken = user.inviteToken; out.invitePath = `/accept-invite/${user.inviteToken}`; }
  res.json(out);
}));

module.exports = router;
```

- [ ] **Step 4: Mount in `backend/src/app.js`** — after the auth mount add:

```js
  app.use("/api/users", require("./routes/users"));
```

- [ ] **Step 5: Run to verify pass**

Run: `cd backend && npx jest tests/users.test.js --runInBand`
Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/users.js backend/src/app.js backend/tests/users.test.js
git commit -m "feat(api): users routes (create/list developers, invites, enable/disable)"
```

### Task 1.8: Projects routes (spaces + membership)

**Files:**
- Create: `backend/src/routes/projects.js`
- Modify: `backend/src/app.js`
- Test: `backend/tests/projects.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/projects.test.js`

```js
const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

async function mgr() { return makeUser({ role: "manager", email: "m@x.com" }); }

test("manager creates a project", async () => {
  const { token } = await mgr();
  const res = await api().post("/api/projects").set(auth(token))
    .send({ name: "Atlas Web App", key: "atlas", tone: "teal" });
  expect(res.status).toBe(201);
  expect(res.body.project.key).toBe("ATLAS");
});

test("developer cannot create a project", async () => {
  const { token } = await makeUser({ role: "developer", email: "d@x.com" });
  const res = await api().post("/api/projects").set(auth(token)).send({ name: "X", key: "X" });
  expect(res.status).toBe(403);
});

test("developer only sees projects they are a member of", async () => {
  const { token: mtoken } = await mgr();
  const { user: dev, token: dtoken } = await makeUser({ role: "developer", email: "d@x.com" });
  const a = await api().post("/api/projects").set(auth(mtoken)).send({ name: "A", key: "A" });
  await api().post("/api/projects").set(auth(mtoken)).send({ name: "B", key: "B" });
  await api().patch(`/api/projects/${a.body.project.id}/members`).set(auth(mtoken)).send({ members: [dev.id] });

  const res = await api().get("/api/projects").set(auth(dtoken));
  expect(res.status).toBe(200);
  expect(res.body.projects.length).toBe(1);
  expect(res.body.projects[0].key).toBe("A");
});

test("manager sees all projects", async () => {
  const { token } = await mgr();
  await api().post("/api/projects").set(auth(token)).send({ name: "A", key: "A" });
  await api().post("/api/projects").set(auth(token)).send({ name: "B", key: "B" });
  const res = await api().get("/api/projects").set(auth(token));
  expect(res.body.projects.length).toBe(2);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/projects.test.js --runInBand`
Expected: FAIL (404s).

- [ ] **Step 3: Write `backend/src/routes/projects.js`**

```js
const router = require("express").Router();
const Project = require("../models/Project");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth, requireManager } = require("../middleware/auth");

router.use(requireAuth);

function projectJson(p) {
  return {
    id: p.id, name: p.name, key: p.key, tone: p.tone,
    members: p.members.map((m) => (m._id ? m._id.toString() : m.toString())),
  };
}

// Manager: all projects. Developer: only projects they're a member of.
router.get("/", asyncH(async (req, res) => {
  const filter = req.user.role === "manager" ? {} : { members: req.user._id };
  const projects = await Project.find(filter).sort({ createdAt: 1 });
  res.json({ projects: projects.map(projectJson) });
}));

router.post("/", requireManager, asyncH(async (req, res) => {
  const { name, key, tone, members } = req.body;
  if (!name || !key) throw new HttpError(400, "Name and key are required");
  const exists = await Project.findOne({ key: String(key).toUpperCase() });
  if (exists) throw new HttpError(409, "A project with that key already exists");
  const project = await Project.create({
    name, key, tone: tone || "teal", members: members || [], createdBy: req.user.id,
  });
  res.status(201).json({ project: projectJson(project) });
}));

router.patch("/:id/members", requireManager, asyncH(async (req, res) => {
  const { members } = req.body;
  if (!Array.isArray(members)) throw new HttpError(400, "members must be an array of user ids");
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, "Project not found");
  project.members = members;
  await project.save();
  res.json({ project: projectJson(project) });
}));

module.exports = router;
```

- [ ] **Step 4: Mount in `backend/src/app.js`**

```js
  app.use("/api/projects", require("./routes/projects"));
```

- [ ] **Step 5: Run to verify pass**

Run: `cd backend && npx jest tests/projects.test.js --runInBand`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/projects.js backend/src/app.js backend/tests/projects.test.js
git commit -m "feat(api): projects routes (create, list scoped, members)"
```

### Task 1.9: Tasks routes (create, list scoped, status, patch) + key generation

**Files:**
- Create: `backend/src/routes/tasks.js`
- Modify: `backend/src/app.js`
- Test: `backend/tests/tasks.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/tasks.test.js`

```js
const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

async function setup() {
  const { token: mtoken } = await makeUser({ role: "manager", email: "m@x.com" });
  const { user: dev, token: dtoken } = await makeUser({ role: "developer", email: "d@x.com" });
  const { user: other, token: otoken } = await makeUser({ role: "developer", email: "o@x.com" });
  const proj = (await api().post("/api/projects").set(auth(mtoken)).send({ name: "Atlas", key: "ATLAS" })).body.project;
  await api().patch(`/api/projects/${proj.id}/members`).set(auth(mtoken)).send({ members: [dev.id] });
  return { mtoken, dev, dtoken, other, otoken, proj };
}

test("manager creates a task with generated key", async () => {
  const { mtoken, dev, proj } = await setup();
  const res = await api().post("/api/tasks").set(auth(mtoken)).send({
    project: proj.id, title: "Fix overflow", assignee: dev.id,
    priority: "high", deadline: "2026-06-20", branch: "feature/x",
  });
  expect(res.status).toBe(201);
  expect(res.body.task.key).toBe("ATLAS-1");
  expect(res.body.task.status).toBe("todo");
  const res2 = await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "Second", deadline: "2026-06-21" });
  expect(res2.body.task.key).toBe("ATLAS-2");
});

test("task requires a deadline", async () => {
  const { mtoken, proj } = await setup();
  const res = await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "No deadline" });
  expect(res.status).toBe(400);
});

test("developer cannot create a task", async () => {
  const { dtoken, proj } = await setup();
  const res = await api().post("/api/tasks").set(auth(dtoken)).send({ project: proj.id, title: "X", deadline: "2026-06-20" });
  expect(res.status).toBe(403);
});

test("developer sees only tasks in their projects, with derived stale", async () => {
  const { mtoken, dev, dtoken, otoken, proj } = await setup();
  await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "Old", assignee: dev.id, deadline: "2000-01-01" });
  const devList = await api().get("/api/tasks").set(auth(dtoken));
  expect(devList.body.tasks.length).toBe(1);
  expect(devList.body.tasks[0].stale).toBe(true);
  const otherList = await api().get("/api/tasks").set(auth(otoken));
  expect(otherList.body.tasks.length).toBe(0); // not a member
});

test("developer can change status only on assigned tasks", async () => {
  const { mtoken, dev, dtoken, otoken, proj } = await setup();
  const t = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-20" })).body.task;
  const ok = await api().patch(`/api/tasks/${t.id}/status`).set(auth(dtoken)).send({ status: "in_progress" });
  expect(ok.status).toBe(200);
  expect(ok.body.task.status).toBe("in_progress");
  const denied = await api().patch(`/api/tasks/${t.id}/status`).set(auth(otoken)).send({ status: "done" });
  expect(denied.status).toBe(403);
});

test("status cannot be set to stale", async () => {
  const { mtoken, dev, dtoken, proj } = await setup();
  const t = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-20" })).body.task;
  const res = await api().patch(`/api/tasks/${t.id}/status`).set(auth(dtoken)).send({ status: "stale" });
  expect(res.status).toBe(400);
});

test("manager patch can change deadline; developer cannot patch", async () => {
  const { mtoken, dtoken, dev, proj } = await setup();
  const t = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-20" })).body.task;
  const ok = await api().patch(`/api/tasks/${t.id}`).set(auth(mtoken)).send({ deadline: "2026-07-01", priority: "low" });
  expect(ok.status).toBe(200);
  expect(ok.body.task.priority).toBe("low");
  const denied = await api().patch(`/api/tasks/${t.id}`).set(auth(dtoken)).send({ title: "hacked" });
  expect(denied.status).toBe(403);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/tasks.test.js --runInBand`
Expected: FAIL (404s).

- [ ] **Step 3: Write `backend/src/routes/tasks.js`**

```js
const router = require("express").Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const { withDerived } = require("../lib/derive");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth, requireManager } = require("../middleware/auth");

router.use(requireAuth);

const REAL_STATUSES = ["todo", "in_progress", "in_review", "done"];

function taskJson(t, now = new Date()) {
  const obj = {
    id: t.id, key: t.key, project: t.project?._id ? t.project._id.toString() : t.project.toString(),
    title: t.title, desc: t.desc,
    assignee: t.assignee ? (t.assignee._id ? t.assignee._id.toString() : t.assignee.toString()) : null,
    priority: t.priority, status: t.status, deadline: t.deadline, branch: t.branch,
    createdBy: t.createdBy ? t.createdBy.toString() : null, ext: t.ext || null,
  };
  return withDerived(obj, now);
}

// Project ids the current user may see.
async function visibleProjectIds(user) {
  if (user.role === "manager") return null; // null = all
  const projects = await Project.find({ members: user._id }).select("_id");
  return projects.map((p) => p._id);
}

router.get("/", asyncH(async (req, res) => {
  const pids = await visibleProjectIds(req.user);
  const filter = {};
  if (pids) filter.project = { $in: pids };
  if (req.query.project) filter.project = req.query.project;
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json({ tasks: tasks.map((t) => taskJson(t)) });
}));

router.get("/:id", asyncH(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  if (req.user.role !== "manager") {
    const project = await Project.findById(task.project);
    if (!project || !project.members.some((m) => m.equals(req.user._id))) throw new HttpError(403, "No access to this task");
  }
  res.json({ task: taskJson(task) });
}));

router.post("/", requireManager, asyncH(async (req, res) => {
  const { project, title, desc, assignee, priority, deadline, branch } = req.body;
  if (!project || !title) throw new HttpError(400, "Project and title are required");
  if (!deadline) throw new HttpError(400, "Deadline is required");
  const proj = await Project.findById(project);
  if (!proj) throw new HttpError(404, "Project not found");
  const num = proj.nextNum;
  proj.nextNum = num + 1;
  await proj.save();
  const task = await Task.create({
    key: `${proj.key}-${num}`, project: proj._id, title, desc: desc || "",
    assignee: assignee || null, priority: priority || "med", status: "todo",
    deadline: new Date(deadline), branch: branch || "", createdBy: req.user.id, ext: null,
  });
  res.status(201).json({ task: taskJson(task) });
}));

// Developer (assigned) or manager changes status. Never "stale" (derived).
router.patch("/:id/status", asyncH(async (req, res) => {
  const { status } = req.body;
  if (!REAL_STATUSES.includes(status)) throw new HttpError(400, "Invalid status");
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  const isAssignee = task.assignee && task.assignee.equals(req.user._id);
  if (req.user.role !== "manager" && !isAssignee) throw new HttpError(403, "You can only update tasks assigned to you");
  task.status = status;
  await task.save();
  res.json({ task: taskJson(task) });
}));

// Manager-only full patch (incl. deadline).
router.patch("/:id", requireManager, asyncH(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  const allowed = ["title", "desc", "assignee", "priority", "status", "deadline", "branch"];
  for (const k of allowed) {
    if (req.body[k] === undefined) continue;
    if (k === "status" && !REAL_STATUSES.includes(req.body[k])) throw new HttpError(400, "Invalid status");
    task[k] = k === "deadline" ? new Date(req.body[k]) : req.body[k];
  }
  await task.save();
  res.json({ task: taskJson(task) });
}));

module.exports = { router, taskJson };
```

Note: this module exports `{ router, taskJson }` so the extensions route (Task 1.10) can reuse `taskJson`.

- [ ] **Step 4: Mount in `backend/src/app.js`**

```js
  app.use("/api/tasks", require("./routes/tasks").router);
```

- [ ] **Step 5: Run to verify pass**

Run: `cd backend && npx jest tests/tasks.test.js --runInBand`
Expected: 7 passing.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/tasks.js backend/src/app.js backend/tests/tasks.test.js
git commit -m "feat(api): tasks routes (create with key gen, scoped list, status, patch)"
```

### Task 1.10: Extension request flow

**Files:**
- Modify: `backend/src/routes/tasks.js` (add two routes to the same router)
- Test: `backend/tests/extensions.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/extensions.test.js`

```js
const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

async function setup() {
  const { token: mtoken } = await makeUser({ role: "manager", email: "m@x.com" });
  const { user: dev, token: dtoken } = await makeUser({ role: "developer", email: "d@x.com" });
  const proj = (await api().post("/api/projects").set(auth(mtoken)).send({ name: "Atlas", key: "ATLAS" })).body.project;
  await api().patch(`/api/projects/${proj.id}/members`).set(auth(mtoken)).send({ members: [dev.id] });
  const task = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-10" })).body.task;
  return { mtoken, dtoken, dev, proj, task };
}

test("developer requests an extension; it becomes pending", async () => {
  const { dtoken, task } = await setup();
  const res = await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken))
    .send({ requestedDate: "2026-06-20", note: "Need more time" });
  expect(res.status).toBe(200);
  expect(res.body.task.ext.state).toBe("pending");
  expect(res.body.task.ext.note).toBe("Need more time");
});

test("non-assignee cannot request an extension", async () => {
  const { mtoken, task } = await setup();
  const { token: otoken } = await makeUser({ role: "developer", email: "o@x.com" });
  const res = await api().post(`/api/tasks/${task.id}/extension`).set(auth(otoken)).send({ requestedDate: "2026-06-20", note: "x" });
  expect(res.status).toBe(403);
});

test("manager approve uses the requested date", async () => {
  const { dtoken, mtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(mtoken))
    .send({ decision: "approve", managerNote: "ok" });
  expect(res.status).toBe(200);
  expect(res.body.task.ext.state).toBe("approved");
  expect(new Date(res.body.task.deadline).toISOString().slice(0, 10)).toBe("2026-06-20");
});

test("manager modify uses newDate, not requested", async () => {
  const { dtoken, mtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(mtoken))
    .send({ decision: "modify", newDate: "2026-06-15", managerNote: "partial" });
  expect(new Date(res.body.task.deadline).toISOString().slice(0, 10)).toBe("2026-06-15");
  expect(res.body.task.ext.grantedDate).toBeTruthy();
});

test("manager deny leaves the deadline unchanged", async () => {
  const { dtoken, mtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(mtoken))
    .send({ decision: "deny", managerNote: "no" });
  expect(res.body.task.ext.state).toBe("denied");
  expect(new Date(res.body.task.deadline).toISOString().slice(0, 10)).toBe("2026-06-10");
});

test("developer cannot decide an extension", async () => {
  const { dtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(dtoken)).send({ decision: "approve" });
  expect(res.status).toBe(403);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/extensions.test.js --runInBand`
Expected: FAIL (404s on the extension routes).

- [ ] **Step 3: Add routes to `backend/src/routes/tasks.js`** — insert these two route handlers **before** the final `module.exports` line:

```js
// Developer (assignee) requests a deadline extension.
router.post("/:id/extension", asyncH(async (req, res) => {
  const { requestedDate, note } = req.body;
  if (!requestedDate) throw new HttpError(400, "A requested date is required");
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  const isAssignee = task.assignee && task.assignee.equals(req.user._id);
  if (!isAssignee) throw new HttpError(403, "You can only request extensions on tasks assigned to you");
  task.ext = {
    state: "pending", requestedDate: new Date(requestedDate), note: note || "",
    requestedAt: new Date(), requestedBy: req.user._id, originalDeadline: task.deadline,
  };
  await task.save();
  res.json({ task: taskJson(task) });
}));

// Manager decides: approve (requested date) | modify (newDate) | deny.
router.post("/:id/extension/decide", requireManager, asyncH(async (req, res) => {
  const { decision, newDate, managerNote } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  if (!task.ext || task.ext.state !== "pending") throw new HttpError(400, "No pending extension request");
  task.ext.managerNote = managerNote || "";
  task.ext.decidedDate = new Date();
  task.ext.decidedBy = req.user._id;
  if (decision === "approve") {
    task.ext.state = "approved";
    task.deadline = task.ext.requestedDate;
  } else if (decision === "modify") {
    if (!newDate) throw new HttpError(400, "newDate is required to modify");
    task.ext.state = "approved";
    task.ext.grantedDate = new Date(newDate);
    task.deadline = new Date(newDate);
  } else if (decision === "deny") {
    task.ext.state = "denied";
  } else {
    throw new HttpError(400, "decision must be approve, modify, or deny");
  }
  await task.save();
  res.json({ task: taskJson(task) });
}));
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && npx jest tests/extensions.test.js --runInBand`
Expected: 6 passing.

- [ ] **Step 5: Run the full backend suite**

Run: `cd backend && npm test`
Expected: all test files green.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/tasks.js backend/tests/extensions.test.js
git commit -m "feat(api): extension request and decide flow"
```

### Task 1.11: Seed script (manager bootstrap)

**Files:**
- Create: `backend/src/seed.js`
- Test: `backend/tests/seed.test.js`

- [ ] **Step 1: Write the failing test** `backend/tests/seed.test.js`

```js
const { setupDb, teardownDb, clearDb } = require("./helpers");
const User = require("../src/models/User");
const { seedManager } = require("../src/seed");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("seedManager creates the manager when none exist", async () => {
  const created = await seedManager({ email: "esty@simplecodeai.com", name: "Esty", password: "pw123456" });
  expect(created).toBe(true);
  const u = await User.findOne({ email: "esty@simplecodeai.com" });
  expect(u.role).toBe("manager");
  expect(u.status).toBe("active");
  expect(u.passwordHash).toBeTruthy();
});

test("seedManager is idempotent (no duplicate)", async () => {
  await seedManager({ email: "esty@simplecodeai.com", name: "Esty", password: "pw123456" });
  const created = await seedManager({ email: "esty@simplecodeai.com", name: "Esty", password: "pw123456" });
  expect(created).toBe(false);
  expect(await User.countDocuments()).toBe(1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && npx jest tests/seed.test.js --runInBand`
Expected: FAIL — cannot find `seedManager`.

- [ ] **Step 3: Write `backend/src/seed.js`**

```js
const mongoose = require("mongoose");
const User = require("./models/User");
const { hash } = require("./lib/password");
const { connectDb } = require("./db");
const config = require("./config");

// Returns true if it created the manager, false if one already existed.
async function seedManager({ email, name, password } = config.seedManager) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return false;
  await User.create({
    name, email, role: "manager", status: "active", passwordHash: await hash(password),
  });
  return true;
}

async function runCli() {
  await connectDb();
  const created = await seedManager();
  if (created) {
    console.log(`Seeded manager ${config.seedManager.email}.`);
    if (config.seedManager.password === "ChangeMe!2026") {
      console.warn("WARNING: using the default SEED_MANAGER_PASSWORD — change it after first login.");
    }
  } else {
    console.log("Manager already exists; nothing to seed.");
  }
  await mongoose.disconnect();
}

if (require.main === module) runCli().catch((e) => { console.error(e); process.exit(1); });

module.exports = { seedManager };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && npx jest tests/seed.test.js --runInBand`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/seed.js backend/tests/seed.test.js
git commit -m "feat(api): idempotent manager seed script"
```

### Task 1.12: Live smoke test against Atlas + seed

**Files:** none (operational verification)

- [ ] **Step 1: Run the seed against the real DB**

Run: `cd backend && npm run seed`
Expected: "Seeded manager esty@simplecodeai.com." (or "already exists" on re-run).

- [ ] **Step 2: Start the server and hit health + login**

Run (in one shell): `cd backend && npm start`
Run (in another): 
```bash
curl -s http://localhost:4000/api/health
curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"esty@simplecodeai.com\",\"password\":\"ChangeMe!2026\"}"
```
Expected: `{"ok":true}` then a JSON body with a `token`. Stop the server.

- [ ] **Step 2 note:** Use the actual `SEED_MANAGER_PASSWORD` value if you changed it from the default.

---

# PHASE 2 — Frontend foundation

> The prototype's React code in `design-reference/*.jsx` uses globals (`React`, `SCAI`, `lucide`). The frontend ports these into ES modules: `import { useState } from "react"`, replace `SCAI.*` data access with API hooks (Task 2.3), and replace `<i data-lucide>` icons with `lucide-react` components.

### Task 2.1: Global styles + entry

**Files:**
- Modify: `frontend/index.html`, `frontend/src/main.jsx`
- Create: `frontend/src/styles/app.css`
- Delete: default Vite `App.css`, `index.css` boilerplate usage

- [ ] **Step 1: Set `frontend/index.html`** `<head>` to load fonts and title:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Mona+Sans:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:wght@100..800&display=swap" rel="stylesheet" />
<title>Simple Code AI — Task Manager</title>
```

- [ ] **Step 2: Create `frontend/src/styles/app.css`** with the animation tokens the prototype expects (the prototype references `--dur-2`, `--dur-3`, `--ease`, `--font-body`, `--font-mono`):

```css
:root {
  --font-body: "Mona Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --dur-1: 120ms; --dur-2: 180ms; --dur-3: 240ms;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { font-family: var(--font-body); }
@keyframes scaiFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaiRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 3: Set `frontend/src/main.jsx`**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/colors_and_type.css";
import "./styles/scai-brand.css";
import "./styles/app.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 4: Verify it boots** — temporarily make `frontend/src/App.jsx` return `<div>SCAI</div>`.

Run: `cd frontend && npm run dev`
Expected: "SCAI" renders on parchment background, no console errors. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/src/main.jsx frontend/src/styles/app.css frontend/src/App.jsx
git commit -m "feat(ui): global styles, fonts, animation tokens, entry"
```

### Task 2.2: API client + endpoints

**Files:**
- Create: `frontend/src/api/client.js`, `frontend/src/api/endpoints.js`

- [ ] **Step 1: Write `frontend/src/api/client.js`**

```js
import axios from "axios";

const TOKEN_KEY = "scai_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

client.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      setToken(null);
      if (!location.pathname.startsWith("/login")) location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export default client;
```

- [ ] **Step 2: Write `frontend/src/api/endpoints.js`**

```js
import client from "./client";

const data = (p) => p.then((r) => r.data);

export const AuthApi = {
  login: (email, password) => data(client.post("/auth/login", { email, password })),
  me: () => data(client.get("/auth/me")),
  invite: (token) => data(client.get(`/auth/invite/${token}`)),
  acceptInvite: (token, password) => data(client.post("/auth/accept-invite", { token, password })),
  changePassword: (currentPassword, newPassword) => data(client.post("/auth/change-password", { currentPassword, newPassword })),
};

export const UsersApi = {
  list: () => data(client.get("/users")),
  create: (payload) => data(client.post("/users", payload)),
  patch: (id, payload) => data(client.patch(`/users/${id}`, payload)),
};

export const ProjectsApi = {
  list: () => data(client.get("/projects")),
  create: (payload) => data(client.post("/projects", payload)),
  setMembers: (id, members) => data(client.patch(`/projects/${id}/members`, { members })),
};

export const TasksApi = {
  list: (params) => data(client.get("/tasks", { params })),
  get: (id) => data(client.get(`/tasks/${id}`)),
  create: (payload) => data(client.post("/tasks", payload)),
  setStatus: (id, status) => data(client.patch(`/tasks/${id}/status`, { status })),
  patch: (id, payload) => data(client.patch(`/tasks/${id}`, payload)),
  requestExtension: (id, requestedDate, note) => data(client.post(`/tasks/${id}/extension`, { requestedDate, note })),
  decideExtension: (id, decision, opts = {}) => data(client.post(`/tasks/${id}/extension/decide`, { decision, ...opts })),
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api
git commit -m "feat(ui): axios client with JWT interceptor + endpoint wrappers"
```

### Task 2.3: Auth context + data store hook

**Files:**
- Create: `frontend/src/auth/AuthContext.jsx`, `frontend/src/auth/useAuth.js`, `frontend/src/lib/derive.js`, `frontend/src/lib/format.js`, `frontend/src/store/DataContext.jsx`

- [ ] **Step 1: Write `frontend/src/lib/derive.js`** (mirror of backend; the API also sends `stale`, but the board needs it client-side for optimistic updates)

```js
const DAY = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const daysLeft = (task, now = new Date()) => Math.round((startOfDay(task.deadline) - startOfDay(now)) / DAY);
export const isStale = (task, now = new Date()) =>
  task.status !== "done" && task.status !== "in_review" && daysLeft(task, now) < 0;
export const columnOf = (task, now = new Date()) => (isStale(task, now) ? "stale" : task.status);
```

- [ ] **Step 2: Write `frontend/src/lib/format.js`** (ported from `scai-ui.jsx`)

```js
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const d0 = (s) => new Date(s);
export const fmtDate = (s) => { if (!s) return "—"; const d = d0(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
export const fmtShort = (s) => { if (!s) return "—"; const d = d0(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; };
export const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const toInputDate = (s) => (s ? new Date(s).toISOString().slice(0, 10) : "");
export function deadlinePhrase(task) {
  if (task.status === "done") return "delivered";
  const n = task.daysLeft;
  if (n === 0) return "due today";
  if (n > 0) return `in ${n}d`;
  return `${Math.abs(n)}d overdue`;
}
```

- [ ] **Step 3: Write `frontend/src/auth/AuthContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthApi } from "../api/endpoints";
import { getToken, setToken } from "../api/client";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    AuthApi.me().then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await AuthApi.login(email, password);
    setToken(d.token); setUser(d.user); return d.user;
  }, []);

  const acceptInvite = useCallback(async (token, password) => {
    const d = await AuthApi.acceptInvite(token, password);
    setToken(d.token); setUser(d.user); return d.user;
  }, []);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, acceptInvite, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
```

- [ ] **Step 4: Write `frontend/src/store/DataContext.jsx`** — central cache of users/projects/tasks with mutations that re-fetch. This replaces the prototype's `SCAI` store.

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UsersApi, ProjectsApi, TasksApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

const Ctx = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const calls = [ProjectsApi.list(), TasksApi.list()];
    if (user?.role === "manager") calls.push(UsersApi.list());
    const [p, t, u] = await Promise.all(calls);
    setProjects(p.projects); setTasks(t.tasks);
    if (u) setUsers(u.users);
    setReady(true);
  }, [user]);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  // Helpers mirroring SCAI selectors.
  const personById = (id) => users.find((x) => x.id === id) || (user && user.id === id ? user : null);
  const projectById = (id) => projects.find((p) => p.id === id);
  const taskById = (id) => tasks.find((t) => t.id === id);
  const tasksForProject = (pid) => tasks.filter((t) => t.project === pid);
  const pendingExtensions = () => tasks.filter((t) => t.ext && t.ext.state === "pending");
  const resolvedExtensions = () => tasks.filter((t) => t.ext && t.ext.state !== "pending");
  const staleTasks = () => tasks.filter((t) => t.stale);

  const value = {
    users, projects, tasks, ready, refresh,
    personById, projectById, taskById, tasksForProject,
    pendingExtensions, resolvedExtensions, staleTasks,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/auth frontend/src/lib frontend/src/store
git commit -m "feat(ui): auth context, data store, derive + format helpers"
```

### Task 2.4: App router + route guards

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Write `frontend/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { DataProvider } from "./store/DataContext";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import ManagerApp from "./pages/manager/ManagerApp";
import DeveloperApp from "./pages/developer/DeveloperApp";
import { ToastHost } from "./components/ui/Toast";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <DataProvider>
      {user.role === "manager" ? <ManagerApp /> : <DeveloperApp />}
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="/*" element={<Home />} />
        </Routes>
        <ToastHost />
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: This depends on pages/components built next.** Do not run yet — it will fail to import until Tasks 3.x–5.x exist. Commit after Task 5 integration. For now, verify it type-resolves only after components exist.

- [ ] **Step 3: Commit** (after components exist, or stub the imports). For now:

```bash
git add frontend/src/App.jsx
git commit -m "feat(ui): app router with role-based portal routing"
```

---

# PHASE 3 — Shared UI components (port from `scai-ui.jsx`)

> Source: `design-reference/scai-ui.jsx`. Read it. Port each component to an ES module. Two universal changes everywhere: (a) `import { useState, useEffect, useRef } from "react"` instead of destructuring `React`; (b) replace the `Icon` component (which used `<i data-lucide>`) with the `lucide-react` implementation in Task 3.1 and update icon name casing. Keep all inline styles **verbatim** — they encode the approved visual design.

### Task 3.1: Icons + primitives (Icon, Avatar, pills, tags)

**Files:**
- Create: `frontend/src/components/ui/icons.jsx`, `Avatar.jsx`, `pills.jsx`

- [ ] **Step 1: Write `frontend/src/components/ui/icons.jsx`**

```jsx
import * as Lucide from "lucide-react";

// Convert kebab lucide names (used in the prototype) to PascalCase components.
const toPascal = (name) => name.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");

export function Icon({ name, size = 16, color, style }) {
  const Cmp = Lucide[toPascal(name)] || Lucide.Circle;
  return <Cmp size={size} color={color} style={{ flexShrink: 0, ...style }} strokeWidth={1.75} />;
}
```

- [ ] **Step 2: Write `frontend/src/components/ui/Avatar.jsx`** — port `Avatar` + `TONE_FOR` from `scai-ui.jsx`, but take the person object via props/`useData` instead of `SCAI.personById`. Use initials from the person.

```jsx
import { useData } from "../../store/DataContext";

const TONE = ["#1d6e74", "#3a5e6b", "#2d5472", "#3a5e44", "#5e3e6e", "#2a3a4a"];
function toneFor(id) {
  let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONE[h % TONE.length];
}

export default function Avatar({ id, person, size = 28, ring }) {
  const data = useData();
  const p = person || data?.personById(id);
  if (!p) return null;
  return (
    <div title={p.name} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: p.role === "manager" ? "#1e2328" : toneFor(p.id), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-mono)", fontSize: size * 0.38, fontWeight: 600, letterSpacing: "0.03em",
      boxShadow: ring ? "0 0 0 2px #fff, 0 0 0 3px var(--bd-2)" : "none",
    }}>{p.initials}</div>
  );
}
```

- [ ] **Step 3: Write `frontend/src/components/ui/pills.jsx`** — port `StatusPill`, `PriorityTag`, `ProjectTag`, `BranchTag` and the `PILL_STYLES` / `PROJECT_TONE` / status+priority metadata maps from `scai-ui.jsx` and `scai-store.js`. Replace `SCAI.STATUS`/`SCAI.PRIORITY`/`SCAI.projectById` with local constants + `useData().projectById`.

```jsx
import { Icon } from "./icons";
import { useData } from "../../store/DataContext";

export const STATUS = {
  todo: { label: "Todo", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "info" },
  in_review: { label: "In Review", tone: "accent" },
  stale: { label: "Stale", tone: "danger" },
  done: { label: "Done", tone: "success" },
};
export const PRIORITY = {
  high: { label: "High", color: "var(--danger)" },
  med: { label: "Medium", color: "var(--warning)" },
  low: { label: "Low", color: "var(--teal-500)" },
};
const PILL_STYLES = {
  neutral: { bg: "#f0f2f5", fg: "#57606a", bd: "#d0d7de" },
  success: { bg: "#dafbe1", fg: "#1a7f37", bd: "#a0e5b0" },
  warning: { bg: "#fff8c5", fg: "#9a6700", bd: "#e5c07b" },
  danger:  { bg: "#ffebe9", fg: "#cf222e", bd: "#faa9a7" },
  info:    { bg: "rgba(46,175,183,0.10)", fg: "#1a7a82", bd: "rgba(46,175,183,0.30)" },
  accent:  { bg: "rgba(46,175,183,0.12)", fg: "#157880", bd: "rgba(46,175,183,0.35)" },
};
const PROJECT_TONE = {
  teal:  { bg: "rgba(46,175,183,0.09)", fg: "#157880", bd: "rgba(46,175,183,0.28)" },
  coral: { bg: "rgba(46,175,183,0.07)", fg: "#1a7a82", bd: "rgba(46,175,183,0.22)" },
  sand:  { bg: "#f0f2f5", fg: "#57606a", bd: "#d0d7de" },
};

export function StatusPill({ status, dot = true, size = 11 }) {
  const meta = STATUS[status] || STATUS.todo;
  const s = PILL_STYLES[meta.tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: size, fontWeight: 500, padding: "3px 8px", borderRadius: "var(--r-1)", background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />}
      {meta.label}
    </span>
  );
}
export function PriorityTag({ priority, withLabel = true }) {
  const meta = PRIORITY[priority] || PRIORITY.med;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 1, background: meta.color, transform: "rotate(45deg)" }} />
      {withLabel && meta.label}
    </span>
  );
}
export function ProjectTag({ projectId }) {
  const p = useData().projectById(projectId);
  if (!p) return null;
  const t = PROJECT_TONE[p.tone] || PROJECT_TONE.teal;
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, letterSpacing: "0.05em", textTransform: "uppercase" }}>{p.key}</span>;
}
export function BranchTag({ branch }) {
  if (!branch) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", background: "rgba(46,175,183,0.08)", border: "1px solid rgba(46,175,183,0.22)", borderRadius: 3, padding: "2px 7px", maxWidth: "100%", overflow: "hidden" }}>
      <Icon name="git-branch" size={12} style={{ color: "var(--scai-teal)" }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch}</span>
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/icons.jsx frontend/src/components/ui/Avatar.jsx frontend/src/components/ui/pills.jsx
git commit -m "feat(ui): Icon, Avatar, status/priority/project/branch pills"
```

### Task 3.2: Buttons, Modal, form fields

**Files:**
- Create: `frontend/src/components/ui/Btn.jsx`, `Modal.jsx`, `fields.jsx`

- [ ] **Step 1: Port `Btn` from `scai-ui.jsx`** into `Btn.jsx` (default export `Btn`). Keep the `kinds` map and hover handlers verbatim; swap the `Icon` import to `./icons`.
- [ ] **Step 2: Port `Modal` from `scai-ui.jsx`** into `Modal.jsx` (default export). Keep escape-key effect and styles verbatim; import `Icon` from `./icons`.
- [ ] **Step 3: Port `Field`, `inputStyle`, `TextInput`, `TextArea`, `Select` from `scai-ui.jsx`** into `fields.jsx` (named exports). Verbatim styles.

Because these are direct ports with only the two universal changes (react imports + Icon import), copy the bodies from `design-reference/scai-ui.jsx` lines for `Btn` (102–137), `Modal` (139–165), and form fields (167–196). Verify each compiles.

- [ ] **Step 4: Smoke-render** — temporarily import `Btn` and `Modal` in `App.jsx` home stub and confirm a button renders and a modal opens. Revert the stub.

Run: `cd frontend && npm run dev` — confirm no console errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Btn.jsx frontend/src/components/ui/Modal.jsx frontend/src/components/ui/fields.jsx
git commit -m "feat(ui): Btn, Modal, form fields (ported)"
```

### Task 3.3: Sidebar, TopBar, Toast, EmptyState, Panel, Stat, MetaRow

**Files:**
- Create: `frontend/src/components/ui/Sidebar.jsx`, `TopBar.jsx`, `Toast.jsx`, `misc.jsx`

- [ ] **Step 1: Port `Toast.jsx`** — port `ToastHost` + `toast()` from `scai-ui.jsx` (252–276). Replace `useIcons()` (lucide CDN) with nothing (lucide-react needs no global init). Keep styles verbatim. Export `{ ToastHost, toast }`.

```jsx
import { useState, useEffect } from "react";
import { Icon } from "./icons";

let _push = null;
export function toast(msg, tone = "success") { _push && _push(msg, tone); }

export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    _push = (msg, tone = "success") => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, msg, tone }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
    };
    return () => { _push = null; };
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 200, alignItems: "center" }}>
      {items.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--scai-slate)", color: "#fff", padding: "10px 16px", borderRadius: "var(--r-2)", boxShadow: "var(--shadow-2)", fontSize: 13, fontWeight: 500, animation: "scaiRise var(--dur-3) var(--ease)", maxWidth: 440 }}>
          <Icon name={t.tone === "success" ? "check-circle-2" : t.tone === "danger" ? "alert-circle" : "info"} size={15} style={{ color: t.tone === "danger" ? "#f85149" : "var(--scai-teal)" }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
```

Note: `check-circle-2` → ensure lucide-react has `CheckCircle2` (it does). If a name is missing, the `Icon` fallback renders a circle.

- [ ] **Step 2: Port `TopBar.jsx`** from `scai-ui.jsx` (228–250) verbatim (default export). No data deps.
- [ ] **Step 3: Port `misc.jsx`** — `EmptyState` (279–289), `Panel` (305–315), `Stat` (317–324), `MetaRow` (293–303). Named exports. Import `Icon` from `./icons`.
- [ ] **Step 4: Write `Sidebar.jsx`** — port the flat `Sidebar` (199–225) **and** extend it for the spaces-first collapsible hierarchy the prototype's HTML shells use (Dashboard / Extension requests / [Stale tasks] / SPACES → each space expands to Board + List). Read the sidebar JSX in `design-reference/Simple Code AI - Manager.html` and `Simple Code AI - Developer.html` (the `<script type="text/babel">` block) and reproduce that collapsible structure. Keep the logo block (`src` now `import logo from "../../assets/scai-logo.png"`, `mixBlendMode: "multiply"`), the `tag` eyebrow, teal left-border active state, and badge styles verbatim. Signature:

```jsx
// <Sidebar tag="MANAGING ENGINEER" logo={logo} top={[...]} spaces={[...]}
//   active={{view, projectId}} onNavigate={(view, projectId) => ...} footer={...} />
// top: [{ id, label, icon, badge, danger }]; spaces: [{ id, name, key, staleCount, hasExt }]
```

Implementation detail: track `expanded` set in local state; clicking a space name navigates to its board and toggles expand; Board/List sub-items call `onNavigate("board"|"list", space.id)`. Danger items (Stale tasks) use red (`var(--danger)`) for the active border/icon/badge instead of teal.

- [ ] **Step 5: Smoke-render** the Sidebar with mock props in the App stub; confirm spaces expand/collapse. Revert stub.
- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/Sidebar.jsx frontend/src/components/ui/TopBar.jsx frontend/src/components/ui/Toast.jsx frontend/src/components/ui/misc.jsx
git commit -m "feat(ui): Sidebar (spaces-first), TopBar, Toast, Panel, Stat, EmptyState"
```

### Task 3.4: Board, Column, TaskCard

**Files:**
- Create: `frontend/src/components/board/Board.jsx`, `Column.jsx`, `TaskCard.jsx`

> Source patterns: the board markup lives in `design-reference/dev-views.jsx` (developer board) and `mgr-views.jsx` (manager board). Read both. The kanban has 5 columns in order `todo, in_progress, in_review, stale, done`. Cards are draggable via HTML5 DnD; dropping on a column calls `setStatus`. **Stale is read-only**: a card cannot be dragged into the Stale column, and dragging a stale card to another column is allowed only if it maps to a real status (the underlying status changes; staleness recomputes).

- [ ] **Step 1: Write `TaskCard.jsx`** — render a card: project tag + key, title, priority diamond, assignee avatar, deadline phrase (red if overdue/stale), branch tag, and (developer view) a "Request ext" affordance if `onRequestExt` provided. Make it `draggable` and call `onDragStart(task)`. Match card styling from `dev-views.jsx` (parchment card, 1px border, radius var(--r-2), padding). Props: `{ task, onClick, onDragStart, onRequestExt }`.

- [ ] **Step 2: Write `Column.jsx`** — a column header (status label + count) and a droppable body. Props: `{ status, label, tasks, onDropTask, droppable, children }`. On `onDrop`, if `status === "stale"` ignore (read-only); else call `onDropTask(status)`. Highlight on dragOver.

- [ ] **Step 3: Write `Board.jsx`** — lays out the 5 columns horizontally (horizontal scroll on narrow screens, as the design notes). Groups tasks by `columnOf(task)`. Holds the `draggedTask` state; wires `Column.onDropTask(status)` → `onSetStatus(draggedTask, status)`. Props: `{ tasks, onSetStatus, onOpenTask, onRequestExt, canDrag }`. The order and labels come from `STATUS`. For manager, `canDrag` true on all real columns; for developer, `canDrag` true only on tasks assigned to the current user (pass a predicate or pre-filter).

```jsx
import { useState } from "react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import { columnOf } from "../../lib/derive";

const ORDER = [
  ["todo", "Todo"], ["in_progress", "In Progress"], ["in_review", "In Review"],
  ["stale", "Stale"], ["done", "Done"],
];

export default function Board({ tasks, onSetStatus, onOpenTask, onRequestExt, canDrag = () => true }) {
  const [dragged, setDragged] = useState(null);
  const byCol = Object.fromEntries(ORDER.map(([k]) => [k, []]));
  for (const t of tasks) byCol[columnOf(t)].push(t);
  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: 4, alignItems: "flex-start" }}>
      {ORDER.map(([status, label]) => (
        <Column key={status} status={status} label={label} count={byCol[status].length}
          droppable={status !== "stale" && !!dragged}
          onDropTask={(s) => { if (dragged) { onSetStatus(dragged, s); setDragged(null); } }}>
          {byCol[status].map((t) => (
            <TaskCard key={t.id} task={t}
              draggable={canDrag(t) && status !== "stale"}
              onDragStart={() => setDragged(t)}
              onClick={() => onOpenTask(t)}
              onRequestExt={onRequestExt ? () => onRequestExt(t) : undefined} />
          ))}
        </Column>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Smoke-render** Board with 3–4 mock tasks across statuses in the App stub; confirm columns render and a drag from Todo→In Progress fires `onSetStatus`. Revert stub.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/board
git commit -m "feat(ui): kanban Board, Column, TaskCard with read-only stale column"
```

### Task 3.5: TaskDetailModal + ExtensionRequestModal

**Files:**
- Create: `frontend/src/components/task/TaskDetailModal.jsx`, `ExtensionRequestModal.jsx`

> Sources: `design-reference/dev-modals.jsx` (developer task detail drawer + extension request modal) and `mgr-modals.jsx` (manager editable task detail). Read both.

- [ ] **Step 1: Write `ExtensionRequestModal.jsx`** — developer picks a new date (default `addDays(deadline, 7)`, must be after current deadline) + writes a note; calls `TasksApi.requestExtension(taskId, date, note)` then `refresh()` + `toast()`. Uses `Modal`, `Field`, `TextInput type=date`, `TextArea`, `Btn`. Show the locked current deadline with a "Set by <manager>" caption.

- [ ] **Step 2: Write `TaskDetailModal.jsx`** — two modes via a `readOnly` prop:
  - **Developer mode** (`readOnly` true for fields): shows meta rows (project, assignee, priority, deadline locked, branch, status), a status selector (only if assigned to current user), the extension request panel (current ext state + "Request extension" button), and the manager reply if decided. Status change → `TasksApi.setStatus`.
  - **Manager mode** (editable): editable title/desc/assignee(limited to project members)/priority/deadline/branch via `TasksApi.patch`; plus the extension decision controls if `ext.state === 'pending'` (Approve / Adjust date / Deny + reply note → `TasksApi.decideExtension`).

  Reuse `MetaRow`, `Field`, `Select`, `TextInput`, `TextArea`, `StatusPill`, `Avatar`. Match the modal layout in the reference files.

- [ ] **Step 3: Smoke-render** both modals from the App stub with a mock task. Confirm open/close and that the date input rejects dates ≤ current deadline (disable confirm). Revert stub.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/task
git commit -m "feat(ui): task detail modal (dev/manager) + extension request modal"
```

---

# PHASE 4 — Auth pages

### Task 4.1: Login page

**Files:**
- Create: `frontend/src/pages/Login.jsx`

- [ ] **Step 1: Write `Login.jsx`** — centered card on the parchment background: SCAI logo, "Sign in" heading, email + password `Field`s, submit `Btn` (primary, full). On submit call `useAuth().login(email, password)`; on success `navigate("/")`; on failure show inline error + `toast(err.response?.data?.error || "Login failed", "danger")`. If already logged in (`useAuth().user`), `Navigate to="/"`.

```jsx
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Field, TextInput } from "../components/ui/fields";
import Btn from "../components/ui/Btn";
import logo from "../assets/scai-logo.png";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await login(email, password); nav("/"); }
    catch (e2) { setErr(e2.response?.data?.error || "Login failed"); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-1)" }}>
      <form onSubmit={submit} style={{ width: 360, background: "#fff", border: "1px solid var(--bd-1)", borderTop: "3px solid var(--scai-teal)", borderRadius: "var(--r-3)", boxShadow: "var(--shadow-2)", padding: 28 }}>
        <img src={logo} alt="Simple Code AI" height="38" style={{ display: "block", mixBlendMode: "multiply", marginBottom: 18 }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 18 }}>Sign in</div>
        <Field label="Email" required><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></Field>
        <Field label="Password" required><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <div style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
        <Btn kind="primary" full disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Btn>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Manual check** — `npm run dev`, visit `/login`, submit wrong creds → see error; submit `esty@simplecodeai.com` + seed password → redirected (will land on a portal once portals exist).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "feat(ui): login page"
```

### Task 4.2: Accept-invite page

**Files:**
- Create: `frontend/src/pages/AcceptInvite.jsx`

- [ ] **Step 1: Write `AcceptInvite.jsx`** — read `:token` from the URL; on mount `AuthApi.invite(token)` to fetch `{ name, email }` (show "invite invalid/expired" if it 404/410s). Render the name/email (read-only), a "Choose a password" + "Confirm password" field (min 8, must match). On submit call `useAuth().acceptInvite(token, password)` → `navigate("/")`. Same card styling as Login.

- [ ] **Step 2: Manual check** — create a developer via the API (or wait for the Team page), open `/accept-invite/<token>`, set a password, confirm auto-login lands on the developer portal.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AcceptInvite.jsx
git commit -m "feat(ui): accept-invite page (developer sets own password)"
```

---

# PHASE 5 — Portals

> Both portals share a layout: `<Sidebar/>` + main column (`<TopBar/>` + scrollable content). Navigation state lives in the App component (`view` + `projectId`). Build the developer portal first (simpler), then the manager portal.

### Task 5.1: Developer portal shell + Dashboard

**Files:**
- Create: `frontend/src/pages/developer/DeveloperApp.jsx`, `Dashboard.jsx`

- [ ] **Step 1: Write `DeveloperApp.jsx`** — layout + routing state. Build sidebar props from `useData()`:
  - `top`: `[{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard" }, { id: "requests", label: "Extension requests", icon: "clock", badge: <count of this dev's pending exts> }]`
  - `spaces`: the dev's projects, each `{ id, name, key, staleCount }`.
  - Footer: current user name + a logout button (`useAuth().logout`).
  - Render the active view: `dashboard` → `<Dashboard/>`; `requests` → `<Approvals/>` (dev variant, read-only history); space `board`/`list` → `<SpaceView mode/>`.
  - Manage modal state for TaskDetail + ExtensionRequest at this level so any view can open them.

- [ ] **Step 2: Write developer `Dashboard.jsx`** — port `DevDashboard` from `design-reference/dev-views.jsx`: stat tiles (open, stale, in review, pending requests) using `Stat` + `Panel`; a Stale tasks table (your stale tasks) with inline "Request ext" buttons; an extension request feed with status dots. Data from `useData()` filtered to the current user's assigned/visible tasks. Read the reference for exact layout.

- [ ] **Step 3: Manual check** — log in as a developer (after Team page exists, or seed one manually) and confirm dashboard renders. For now, verify it renders without crashing using the manager-created dev once Team exists; otherwise defer this check to Task 5.6 integration.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/developer/DeveloperApp.jsx frontend/src/pages/developer/Dashboard.jsx
git commit -m "feat(ui): developer portal shell + dashboard"
```

### Task 5.2: Developer SpaceView (Board + List) + Approvals

**Files:**
- Create: `frontend/src/pages/developer/SpaceView.jsx`, `Approvals.jsx`

- [ ] **Step 1: Write `SpaceView.jsx`** — takes `{ projectId, mode }` (`mode` = "board" | "list"). Filters `useData().tasksForProject(projectId)`.
  - Board mode: `<Board tasks={projectTasks} canDrag={(t) => t.assignee === user.id} onSetStatus={...} onOpenTask={...} onRequestExt={...} />`. `onSetStatus(task, status)` → `TasksApi.setStatus(task.id, status)` then `refresh()`; guard: if not assignee, `toast("Not your task","danger")`.
  - List mode: port the sortable table from `dev-views.jsx` (`DevList`) — columns: key, title, status pill, assignee avatar, priority, deadline (with overdue color), branch. Sortable by clicking headers; group-by-assignee toggle.
  - Show "Set by <manager>" caption on deadlines (locked).

- [ ] **Step 2: Write developer `Approvals.jsx`** — the developer's extension request history (read-only): list of their tasks with `ext != null`, each showing requested date, note, state pill, and the manager's reply note + decided date when resolved. Port from the dev requests view in `dev-views.jsx`.

- [ ] **Step 3: Manual check (deferred to 5.6 integration).**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/developer/SpaceView.jsx frontend/src/pages/developer/Approvals.jsx
git commit -m "feat(ui): developer space board/list + extension request history"
```

### Task 5.3: Manager portal shell + Dashboard

**Files:**
- Create: `frontend/src/pages/manager/ManagerApp.jsx`, `Dashboard.jsx`

- [ ] **Step 1: Write `ManagerApp.jsx`** — like `DeveloperApp` but:
  - `top`: Dashboard, Extension requests (badge = pending count), **Stale tasks** (badge = stale count, `danger: true`), Team.
  - `spaces`: all projects; SPACES header has a `+` that opens Create Task.
  - When inside a space, TopBar shows a "Manage members" + "New task" button.
  - Modal state: CreateTaskModal, ManageMembersModal, TaskDetailModal (manager/editable).

- [ ] **Step 2: Write manager `Dashboard.jsx`** — port `MgrDashboard` from `mgr-views.jsx`: stat tiles; **"⚠ Stale Tasks"** panel (red title + red past-deadline count) listing stale/overdue tasks; pending extension request queue (compact, click to open decision); per-developer workload bars. Read the reference for exact layout and the red-accent treatment.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/manager/ManagerApp.jsx frontend/src/pages/manager/Dashboard.jsx
git commit -m "feat(ui): manager portal shell + dashboard"
```

### Task 5.4: Manager Approvals (checklist), Stale tasks, SpaceView

**Files:**
- Create: `frontend/src/pages/manager/Approvals.jsx`, `StaleTasks.jsx`, `SpaceView.jsx`

- [ ] **Step 1: Write manager `Approvals.jsx`** — port `MgrApprovals` (checklist style) from `mgr-views.jsx`: compact one-row-per-request list (status dot · avatar · first name · task key · title · `+Nd` delta chip · date · quick Approve · chevron). Expand a row → developer note + **Approve / Adjust date / Deny** inline; Approve/Deny show an optional reply textarea then confirm (`TasksApi.decideExtension(id, "approve"|"deny", { managerNote })`); Adjust date opens `TaskDetailModal` (or an inline date picker) and calls `decideExtension(id, "modify", { newDate, managerNote })`. Pending/All filter tabs. `refresh()` + `toast()` after each decision.

- [ ] **Step 2: Write `StaleTasks.jsx`** — port `MgrStaleTasks` from `mgr-stale.jsx`: red alert banner ("N past deadline, M with pending extension requests"), sortable table (Task, Space, Assignee, Overdue [amber <7d / red ≥7d], Ext. request [teal "Pending" chip]); row click opens manager `TaskDetailModal`. Default sort worst-overdue first.

- [ ] **Step 3: Write manager `SpaceView.jsx`** — `{ projectId, mode }`. Board: `<Board canDrag={() => true} onSetStatus={(t,s) => TasksApi.setStatus(t.id, s)} />` (managers can drag any task). List: port `MgrTasks` sortable/filterable table across the space's tasks. Row/card click opens editable `TaskDetailModal`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/manager/Approvals.jsx frontend/src/pages/manager/StaleTasks.jsx frontend/src/pages/manager/SpaceView.jsx
git commit -m "feat(ui): manager approvals checklist, stale tasks view, space board/list"
```

### Task 5.5: Manager Team, CreateTaskModal, ManageMembersModal

**Files:**
- Create: `frontend/src/pages/manager/Team.jsx`, `CreateTaskModal.jsx`, `ManageMembersModal.jsx`

- [ ] **Step 1: Write `Team.jsx`** — list developers (`useData().users` filtered to `role === "developer"`) in a table: avatar, name, email, title, status pill (invited/active/disabled). A "New developer" button opens a create form (name, email, title) → `UsersApi.create(...)`; on success, show the returned invite link in a modal with a copy button (`navigator.clipboard.writeText(window.location.origin + invitePath)`) + `toast("Invite link created")`. Row actions: disable/enable, re-invite (`UsersApi.patch(id, { action })` → if reinvite, show new link). `refresh()` after mutations.

- [ ] **Step 2: Write `CreateTaskModal.jsx`** — port `CreateTaskModal` from `mgr-modals.jsx`: fields project (Select), title, desc, assignee (Select limited to the selected project's members), priority, **deadline (required, date input)**, branch. Validate deadline present. Submit → `TasksApi.create(payload)` → `refresh()` + `toast("Task created")`. If opened from a space, default the project.

- [ ] **Step 3: Write `ManageMembersModal.jsx`** — port `ManageMembersModal` from `mgr-modals.jsx`: shows current members as chips (× to remove); an email/name search dropdown over all developers not yet members (filter `useData().users`); selecting adds them. Save → `ProjectsApi.setMembers(projectId, memberIds)` → `refresh()` + `toast`. Handle "all developers added" empty state.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/manager/Team.jsx frontend/src/pages/manager/CreateTaskModal.jsx frontend/src/pages/manager/ManageMembersModal.jsx
git commit -m "feat(ui): manager team (invites), create task, manage members"
```

### Task 5.6: End-to-end integration & UAT

**Files:** none (wiring verification); fix any import/glue bugs found.

- [ ] **Step 1: Start both servers** — `cd backend && npm start` and `cd frontend && npm run dev`. Ensure the manager is seeded (`npm run seed`).

- [ ] **Step 2: Manager flow** — log in as `esty@simplecodeai.com`. Create a project (if no Create Project UI was built, note it: add a minimal "New space" button to the SPACES `+` or Team page — see Step 7). Open Team → create a developer → copy the invite link.

- [ ] **Step 3: Developer onboarding** — open the invite link in a private window, set a password, confirm auto-login to the developer portal. Confirm the developer sees only spaces they're a member of (add them via Manage members first).

- [ ] **Step 4: Task + extension flow** — as manager, create a task assigned to the developer with a past deadline → confirm it shows as **Stale** on both the manager Stale view and (for the dev) their board. As the developer, open the task → "Request extension" with a future date + note. As the manager, see it in **Extension requests** → Approve → confirm the deadline moves and the task leaves Stale; the developer sees the new deadline + manager reply.

- [ ] **Step 5: Permission checks** — as the developer, confirm there is no "New task" button and no ability to edit a deadline; confirm dragging a card onto the Stale column does nothing; confirm changing status on a task assigned to someone else is not offered/!allowed.

- [ ] **Step 6: Fix glue bugs** — resolve any console errors, missing imports, or prop mismatches found. Commit fixes as `fix(ui): ...`.

- [ ] **Step 7 (if needed): Add "New space" UI** — the spec lists project creation as manager-only but the portal screens above focus on membership. If no create-project entry point exists, add a small modal (name, key, tone) wired to `ProjectsApi.create` reachable from the SPACES `+` (alongside New Task) or the Team page. Commit `feat(ui): create project (space) modal`.

- [ ] **Step 8: Full backend regression** — `cd backend && npm test` → all green.

- [ ] **Step 9: Commit any remaining fixes and finalize the App.jsx wiring**

```bash
git add -A
git commit -m "feat: end-to-end integration of developer and manager portals"
```

---

# PHASE 6 — Docs & wrap-up

### Task 6.1: README + run instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`** with setup + run instructions: prerequisites (Node 18+, MongoDB Atlas URI), backend setup (`cd backend && npm install`, copy `.env.example`→`.env`, set secrets, `npm run seed`, `npm start`), frontend setup (`cd frontend && npm install`, `npm run dev`), default login (`esty@simplecodeai.com` / `SEED_MANAGER_PASSWORD`), the invite flow, and `npm test` for the backend suite. Document the roles and core flows briefly.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: setup, run, and usage instructions"
```

### Task 6.2: Final verification

- [ ] **Step 1:** `cd backend && npm test` → all green.
- [ ] **Step 2:** Build the frontend: `cd frontend && npm run build` → no errors.
- [ ] **Step 3:** Confirm `.env` is not tracked: `git ls-files | grep -c "backend/.env$"` → expect `0`.
- [ ] **Step 4:** Push `develop` if a remote is configured (`git push -u origin develop`), otherwise leave committed locally.

---

## Self-review notes (coverage vs. spec)

- §2 Architecture → Tasks 0.2, 0.3, 2.x. ✅
- §3 Data model (User/Project/Task/ext/derived stale) → Tasks 1.3, 1.4. ✅
- §4 Auth & permissions (login, me, invite accept, change-pw; server-side gates) → Tasks 1.5, 1.6, 1.7, 1.9, 1.10. ✅
- §5 API surface (all rows) → Tasks 1.6–1.10. ✅
- §6 Frontend screens (login, accept-invite, both portals, all views) → Tasks 4.x, 5.x. ✅
- §7 Deviations (real auth, real today, invite-set password, no demo data, read-only stale column) → Tasks 1.4, 1.6/1.7, 1.11, 3.4. ✅
- §8 Seeding & ops (.env ignored, seed manager) → Tasks 0.1, 1.11, 1.12. ✅
- §9 Testing (auth/users/projects/tasks/extensions/derive/seed) → Tasks 1.1–1.11. ✅
- §10 Out of scope → not built. ✅

Note added during self-review: project creation UI was implicit in the spec's "Spaces" but not explicitly screened; Task 5.6 Step 7 adds a minimal create-project modal so the manager can bootstrap spaces end-to-end.
