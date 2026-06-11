import { useState } from "react";
import Sidebar from "../../components/ui/Sidebar";
import TopBar from "../../components/ui/TopBar";
import TaskDetailModal from "../../components/task/TaskDetailModal";
import ExtensionRequestModal from "../../components/task/ExtensionRequestModal";
import Btn from "../../components/ui/Btn";
import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../store/DataContext";
import { isStale } from "../../lib/derive";
import Dashboard from "./Dashboard";
import Approvals from "./Approvals";
import SpaceView from "./SpaceView";

export default function DeveloperApp() {
  const { user, logout } = useAuth();
  const { projects, tasks, pendingExtensions, ready } = useData();

  // nav state: { view, projectId, subView }
  const [nav, setNav] = useState({ view: "dashboard", projectId: null, subView: "board" });

  // modal state
  const [openTaskId, setOpenTaskId] = useState(null);   // TaskDetailModal
  const [extTask, setExtTask] = useState(null);          // ExtensionRequestModal

  function handleNavigate(view, projectId, subView) {
    setNav({ view, projectId: projectId || null, subView: subView || "board" });
  }

  // Pending extension count for THIS developer
  const myPendingExtCount = tasks.filter(
    (t) => t.ext && t.ext.state === "pending" && t.assignee === user?.id
  ).length;

  // Sidebar top items
  const topItems = [
    { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
    {
      id: "requests",
      label: "Extension requests",
      icon: "clock",
      badge: myPendingExtCount,
    },
  ];

  // Sidebar spaces: projects with stale count
  const spaceItems = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.project === p.id);
    const staleCount = projectTasks.filter((t) => isStale(t)).length;
    const hasExt = projectTasks.some(
      (t) => t.ext && t.ext.state === "pending" && t.assignee === user?.id
    );
    return { id: p.id, name: p.name, key: p.key, staleCount, hasExt };
  });

  // Footer
  const footer = (
    <div style={{
      borderTop: "1px solid var(--bd-1)",
      paddingTop: 12,
      marginTop: 8,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 4px" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: "#1e2328",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>
          {user?.initials || "??"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.title || "Developer"}
          </div>
        </div>
      </div>
      <Btn kind="ghost" size="sm" icon="log-out" onClick={logout} full>
        Sign out
      </Btn>
    </div>
  );

  // Derive TopBar props from current nav
  function getTopBarProps() {
    if (nav.view === "dashboard") {
      return { title: "Dashboard", crumbs: ["Developer"] };
    }
    if (nav.view === "requests") {
      return { title: "Extension Requests", crumbs: ["Developer", "Requests"] };
    }
    if (nav.view === "space" && nav.projectId) {
      const proj = projects.find((p) => p.id === nav.projectId);
      const subLabel = nav.subView === "list" ? "List" : "Board";
      return {
        title: proj ? proj.name : "Space",
        crumbs: ["Spaces", proj ? proj.key : "", subLabel],
      };
    }
    return { title: "Developer Portal", crumbs: [] };
  }

  const topBarProps = getTopBarProps();

  if (!ready) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)", color: "var(--fg-3)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--paper-2)" }}>
      <Sidebar
        tag="Developer Portal"
        top={topItems}
        spaces={spaceItems}
        active={{ view: nav.view, projectId: nav.projectId, subView: nav.subView }}
        onNavigate={handleNavigate}
        footer={footer}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          crumbs={topBarProps.crumbs}
          title={topBarProps.title}
        />

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {nav.view === "dashboard" && (
            <Dashboard
              onOpenTask={setOpenTaskId}
              onRequestExt={setExtTask}
              goTo={(view) => setNav({ view, projectId: null, subView: "board" })}
            />
          )}
          {nav.view === "requests" && (
            <Approvals onOpenTask={setOpenTaskId} />
          )}
          {nav.view === "space" && nav.projectId && (
            <SpaceView
              projectId={nav.projectId}
              mode={nav.subView || "board"}
              onOpenTask={setOpenTaskId}
              onRequestExt={setExtTask}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {openTaskId && (
        <TaskDetailModal
          taskId={openTaskId}
          mode="developer"
          onClose={() => setOpenTaskId(null)}
        />
      )}
      {extTask && (
        <ExtensionRequestModal
          task={extTask}
          onClose={() => setExtTask(null)}
        />
      )}
    </div>
  );
}
