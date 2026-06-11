/* ============================================================
   Simple Code AI CRM — shared data store
   Plain JS. Both Developer.html and Manager.html load this file,
   so they read/write the SAME localStorage record and stay in sync.
   Exposed as window.SCAI.
   ============================================================ */
(function () {
  const KEY = "scai_crm_state_v3";

  // Deterministic "now" so the demo's stale/overdue logic is stable.
  const NOW = new Date("2026-06-10T09:00:00");

  // ---- People ------------------------------------------------------------
  const MANAGER = { id: "m_dana", name: "Dana Okafor", initials: "DO", role: "Managing Engineer", title: "Engineering Lead" };

  const DEVELOPERS = [
    { id: "d_elena", name: "Elena Lopez",   initials: "EL", role: "Developer", title: "Senior Engineer" },
    { id: "d_jamie", name: "Jamie Marston", initials: "JM", role: "Developer", title: "Frontend Engineer" },
    { id: "d_ravi",  name: "Ravi Adeyemi",  initials: "RA", role: "Developer", title: "Backend Engineer" },
    { id: "d_kai",   name: "Kai Nguyen",    initials: "KN", role: "Developer", title: "Mobile Engineer" },
    { id: "d_sana",  name: "Sana Devi",     initials: "SD", role: "Developer", title: "Platform Engineer" },
  ];

  // ---- Projects (spaces) -------------------------------------------------
  const PROJECTS = [
    { id: "p_atlas", name: "Atlas Web App", key: "ATLAS", tone: "teal",  members: ["d_elena", "d_jamie", "d_ravi"] },
    { id: "p_field", name: "Field Mobile",  key: "FIELD", tone: "coral", members: ["d_jamie", "d_kai"] },
    { id: "p_api",   name: "Core API",      key: "API",   tone: "sand",  members: ["d_elena", "d_ravi", "d_sana"] },
    { id: "p_infra", name: "Infra & CI",    key: "INFRA", tone: "teal",  members: ["d_kai", "d_sana"] },
  ];

  // ---- Tasks -------------------------------------------------------------
  // status: todo | in_progress | in_review | done   (stale is DERIVED)
  // ext: null | { state:'pending'|'approved'|'denied', requestedDate, note,
  //               requestedAt, managerNote?, decidedDate?, originalDeadline? }
  const TASKS = [
    { id:"t1",  key:"ATLAS-142", project:"p_atlas", title:"Fix tide-chart overflow on Safari", desc:"The observation tide chart overflows its container on Safari 17. The SVG viewBox math is shared with the print export, so the fix has to hold in both places.", assignee:"d_elena", priority:"high", status:"in_progress", deadline:"2026-06-05", branch:"feature/tide-chart-overflow",
      ext:{ state:"pending", requestedDate:"2026-06-13", note:"This is deeper than scoped — the viewBox calc is shared with the print/PDF export path, so I need to refactor both carefully and add regression tests.", requestedAt:"2026-06-09", originalDeadline:"2026-06-05" } },
    { id:"t2",  key:"ATLAS-145", project:"p_atlas", title:"Debounce the species filter input", desc:"Typing in the species filter fires a request per keystroke. Add a 250ms debounce and cancel in-flight requests.", assignee:"d_jamie", priority:"med", status:"todo", deadline:"2026-06-12", branch:"feature/species-debounce", ext:null },
    { id:"t3",  key:"ATLAS-150", project:"p_atlas", title:"Dark map tiles for night mode", desc:"Swap to the dark tile set when the app is in night mode. Keep marker contrast WCAG AA.", assignee:"d_ravi", priority:"low", status:"in_review", deadline:"2026-06-04", branch:"feature/dark-map-tiles", ext:null },
    { id:"t4",  key:"ATLAS-151", project:"p_atlas", title:"Observer profile redesign", desc:"New profile layout: contribution streak, recent logs, badges. Matches the Atlas card spec.", assignee:"d_elena", priority:"med", status:"todo", deadline:"2026-06-18", branch:"feature/observer-profile", ext:null },
    { id:"t5",  key:"API-88",    project:"p_api",   title:"Rate-limit middleware", desc:"Add token-bucket rate limiting to the public API. Per-key limits, 429 with Retry-After.", assignee:"d_ravi", priority:"high", status:"in_progress", deadline:"2026-06-08", branch:"feature/rate-limit",
      ext:{ state:"pending", requestedDate:"2026-06-16", note:"The upstream auth service changed its key-scoping spec last week; I need ~3 more days to adapt the limiter and cover the new scope edge cases with tests.", requestedAt:"2026-06-09", originalDeadline:"2026-06-08" } },
    { id:"t6",  key:"API-90",    project:"p_api",   title:"Pagination cursor bug", desc:"Cursor pagination drops the last item on page boundaries. Off-by-one in the encoder.", assignee:"d_elena", priority:"high", status:"done", deadline:"2026-06-02", branch:"feature/cursor-bug", ext:null },
    { id:"t7",  key:"API-93",    project:"p_api",   title:"GraphQL schema for sightings", desc:"Expose sightings via GraphQL alongside REST. Cursor connections, field-level auth.", assignee:"d_sana", priority:"med", status:"in_progress", deadline:"2026-06-14", branch:"feature/graphql-sightings", ext:null },
    { id:"t8",  key:"API-95",    project:"p_api",   title:"Migrate to connection pooling", desc:"Move DB access to a pooled client (pgbouncer). Validate under load test.", assignee:"d_sana", priority:"low", status:"todo", deadline:"2026-06-23", branch:"feature/conn-pooling", ext:null },
    { id:"t9",  key:"FIELD-30",  project:"p_field", title:"Offline sync queue", desc:"Queue sightings logged offline and replay on reconnect. Handle conflict resolution.", assignee:"d_kai", priority:"high", status:"in_progress", deadline:"2026-06-09", branch:"feature/offline-sync",
      ext:{ state:"pending", requestedDate:"2026-06-17", note:"Conflict resolution on flaky connections has more edge cases than the original ticket captured (partial writes, clock skew). Want to ship it solid, not patch it later.", requestedAt:"2026-06-09", originalDeadline:"2026-06-09" } },
    { id:"t10", key:"FIELD-33",  project:"p_field", title:"Camera permission prompt", desc:"Pre-permission explainer before the OS camera prompt. Copy from the field-journal voice.", assignee:"d_jamie", priority:"med", status:"in_review", deadline:"2026-06-11", branch:"feature/camera-permission", ext:null },
    { id:"t11", key:"FIELD-35",  project:"p_field", title:"Tide widget on home", desc:"Home-screen widget showing next low tide and a quick-log button.", assignee:"d_kai", priority:"low", status:"todo", deadline:"2026-06-20", branch:"feature/tide-widget", ext:null },
    { id:"t12", key:"INFRA-12",  project:"p_infra", title:"Flaky CI on macOS runners", desc:"macOS runners fail ~1 in 5 with a simulator boot timeout. Pin Xcode + warm the sim.", assignee:"d_kai", priority:"high", status:"in_progress", deadline:"2026-06-06", branch:"feature/ci-macos-flake", ext:null },
    { id:"t13", key:"INFRA-15",  project:"p_infra", title:"Cache node_modules in CI", desc:"Cache the install step keyed on the lockfile hash to cut CI time.", assignee:"d_sana", priority:"med", status:"done", deadline:"2026-05-30", branch:"feature/ci-cache",
      ext:{ state:"approved", requestedDate:"2026-05-30", note:"Lockfile churn from the API migration kept busting the cache key; needed two extra days to stabilize.", requestedAt:"2026-05-26", originalDeadline:"2026-05-28", managerNote:"Approved — the migration churn wasn't your fault. Nice work landing it clean.", decidedDate:"2026-05-26" } },
    { id:"t14", key:"INFRA-18",  project:"p_infra", title:"Secrets rotation playbook", desc:"Document + script rotation for the three production secret stores. Dry-run in staging.", assignee:"d_sana", priority:"low", status:"todo", deadline:"2026-06-25", branch:"feature/secrets-rotation", ext:null },
    { id:"t15", key:"ATLAS-156", project:"p_atlas", title:"Accessibility audit fixes", desc:"Resolve the 14 issues from the a11y audit: focus order, contrast, ARIA on the map controls.", assignee:"d_ravi", priority:"med", status:"todo", deadline:"2026-06-16", branch:"feature/a11y-audit", ext:null },
    { id:"t16", key:"API-97",    project:"p_api",   title:"Webhook retry backoff", desc:"Exponential backoff with jitter for failed webhook deliveries. Dead-letter after 6 tries.", assignee:"d_elena", priority:"med", status:"in_progress", deadline:"2026-06-13", branch:"feature/webhook-backoff", ext:null },
    { id:"t17", key:"FIELD-37",  project:"p_field", title:"Push notification opt-in", desc:"Opt-in flow for tide + rare-sighting alerts. Respects quiet hours.", assignee:"d_jamie", priority:"low", status:"done", deadline:"2026-06-03", branch:"feature/push-optin", ext:null },
    { id:"t18", key:"ATLAS-158", project:"p_atlas", title:"Empty-state illustrations", desc:"Wire the line-drawing empty states into the four list views. Assets are in the kit.", assignee:"d_jamie", priority:"low", status:"todo", deadline:"2026-06-19", branch:"feature/empty-states", ext:null },
  ];

  function seed() {
    return {
      manager: MANAGER,
      developers: DEVELOPERS,
      projects: PROJECTS,
      tasks: TASKS,
      // UI session bits that persist (e.g. which dev you're viewing as)
      session: { devId: "d_elena" },
      nextNum: { ATLAS: 159, FIELD: 38, API: 98, INFRA: 19 },
    };
  }

  // ---- Persistence -------------------------------------------------------
  let state = load();
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const s = seed();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function notify() { listeners.forEach((fn) => fn(state)); }

  function commit(next) {
    state = next;
    save();
    notify();
  }

  // Sync when the OTHER file (other tab) writes.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      try { state = JSON.parse(e.newValue); notify(); } catch (err) {}
    }
  });

  // ---- Selectors ---------------------------------------------------------
  const personById = (id) =>
    id === MANAGER.id ? state.manager : state.developers.find((d) => d.id === id);
  const projectById = (id) => state.projects.find((p) => p.id === id);
  const taskById = (id) => state.tasks.find((t) => t.id === id);

  function dateOnly(s) { const d = new Date(s + "T00:00:00"); return d; }
  function daysBetween(a, b) {
    return Math.round((dateOnly(b) - dateOnly(a)) / 86400000);
  }
  const todayStr = "2026-06-10";

  // A task is stale when its deadline has passed and it is NOT done and NOT in review.
  function isStale(t) {
    if (t.status === "done" || t.status === "in_review") return false;
    return daysBetween(t.deadline, todayStr) > 0;
  }
  // Days remaining (negative = overdue).
  function daysLeft(t) { return daysBetween(todayStr, t.deadline); }

  // Effective kanban column: real status, but stale tasks float into "stale".
  function columnOf(t) { return isStale(t) ? "stale" : t.status; }

  // Projects a developer belongs to.
  const projectsForDev = (devId) =>
    state.projects.filter((p) => p.members.includes(devId));
  // All tasks in the projects a dev can see.
  function visibleTasksForDev(devId) {
    const pids = projectsForDev(devId).map((p) => p.id);
    return state.tasks.filter((t) => pids.includes(t.project));
  }
  // Tasks assigned to a dev (their board).
  const tasksAssignedTo = (devId) => state.tasks.filter((t) => t.assignee === devId);

  const pendingExtensions = () =>
    state.tasks.filter((t) => t.ext && t.ext.state === "pending");
  const resolvedExtensions = () =>
    state.tasks.filter((t) => t.ext && t.ext.state !== "pending");

  // ---- Metadata maps -----------------------------------------------------
  const STATUS = {
    todo:        { label: "Todo",        tone: "neutral" },
    in_progress: { label: "In Progress", tone: "info" },
    in_review:   { label: "In Review",   tone: "accent" },
    stale:       { label: "Stale",       tone: "danger" },
    done:        { label: "Done",        tone: "success" },
  };
  const PRIORITY = {
    high: { label: "High", color: "var(--danger)" },
    med:  { label: "Medium", color: "var(--warning)" },
    low:  { label: "Low", color: "var(--teal-500)" },
  };

  // ---- Mutations ---------------------------------------------------------
  function update(mutator) {
    const next = JSON.parse(JSON.stringify(state));
    mutator(next);
    commit(next);
  }

  function setTaskStatus(taskId, status) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === taskId);
      if (t) t.status = status;
    });
  }

  function requestExtension(taskId, requestedDate, note) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.ext = {
        state: "pending",
        requestedDate,
        note,
        requestedAt: todayStr,
        originalDeadline: t.deadline,
      };
    });
  }

  // decision: 'approve' (use requested date), 'modify' (use newDate), 'deny'
  function decideExtension(taskId, decision, opts = {}) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === taskId);
      if (!t || !t.ext) return;
      t.ext.managerNote = opts.managerNote || "";
      t.ext.decidedDate = todayStr;
      if (decision === "approve") {
        t.ext.state = "approved";
        t.deadline = t.ext.requestedDate;
      } else if (decision === "modify") {
        t.ext.state = "approved";
        t.ext.grantedDate = opts.newDate;
        t.deadline = opts.newDate;
      } else {
        t.ext.state = "denied";
      }
    });
  }

  function createTask(data) {
    update((s) => {
      const proj = s.projects.find((p) => p.id === data.project);
      const k = proj.key;
      const num = s.nextNum[k] || 1;
      s.nextNum[k] = num + 1;
      s.tasks.unshift({
        id: "t" + Date.now(),
        key: k + "-" + num,
        project: data.project,
        title: data.title,
        desc: data.desc || "",
        assignee: data.assignee,
        priority: data.priority || "med",
        status: "todo",
        deadline: data.deadline,
        branch: data.branch || "",
        ext: null,
      });
    });
  }

  function setProjectMembers(projectId, memberIds) {
    update((s) => {
      const p = s.projects.find((x) => x.id === projectId);
      if (p) p.members = memberIds;
    });
  }

  function patchTask(taskId, patch) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === taskId);
      if (t) Object.assign(t, patch);
    });
  }

  function setSessionDev(devId) {
    update((s) => { s.session.devId = devId; });
  }

  // ---- Subscribe ---------------------------------------------------------
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function getState() { return state; }
  function resetDemo() { localStorage.removeItem(KEY); commit(seed()); }

  window.SCAI = {
    NOW, todayStr,
    getState, subscribe, resetDemo,
    personById, projectById, taskById,
    isStale, daysLeft, columnOf, daysBetween,
    projectsForDev, visibleTasksForDev, tasksAssignedTo,
    pendingExtensions, resolvedExtensions,
    STATUS, PRIORITY,
    setTaskStatus, requestExtension, decideExtension, createTask,
    setProjectMembers, patchTask, setSessionDev,
  };
})();
