import { useState } from "react";
import Sidebar from "../../components/ui/Sidebar";
import TopBar from "../../components/ui/TopBar";
import TaskDetailModal from "../../components/task/TaskDetailModal";
import Btn from "../../components/ui/Btn";
import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../store/DataContext";
import { isStale } from "../../lib/derive";
import Dashboard from "./Dashboard";
import Approvals from "./Approvals";
import StaleTasks from "./StaleTasks";
import SpaceView from "./SpaceView";
import Team from "./Team";
import CreateTaskModal from "./CreateTaskModal";
import ManageMembersModal from "./ManageMembersModal";
import CreateProjectModal from "./CreateProjectModal";

export default function ManagerApp() {
  const { user, logout } = useAuth();
  const { projects, tasks, pendingExtensions, staleTasks, ready } = useData();

  // nav state: { view, projectId, subView }
  const [nav, setNav] = useState({ view: "dashboard", projectId: null, subView: "board" });

  // modal state
  const [openTaskId, setOpenTaskId] = useState(null);         // TaskDetailModal (manager mode)
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [manageMembersProjectId, setManageMembersProjectId] = useState(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  function handleNavigate(view, projectId, subView) {
    setNav({ view, projectId: projectId || null, subView: subView || "board" });
  }

  // Sidebar top items
  const topItems = [
    { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
    {
      id: "requests",
      label: "Extension requests",
      icon: "calendar-clock",
      badge: pendingExtensions().length,
    },
    {
      id: "stale",
      label: "Stale tasks",
      icon: "alert-triangle",
      badge: staleTasks().length,
      danger: true,
    },
    { id: "team", label: "Team", icon: "users" },
  ];

  // Sidebar spaces: all projects with stale count + pending ext flag
  const spaceItems = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.project === p.id);
    const staleCount = projectTasks.filter((t) => isStale(t)).length;
    const hasExt = projectTasks.some((t) => t.ext && t.ext.state === "pending");
    return { id: p.id, name: p.name, key: p.key, staleCount, hasExt };
  });

  // Footer: user name + logout
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
          {user?.initials || "M"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.title || "Managing Engineer"}
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
      return { title: "Dashboard", crumbs: ["Manager"] };
    }
    if (nav.view === "requests") {
      return { title: "Extension Requests", crumbs: ["Manager", "Requests"] };
    }
    if (nav.view === "stale") {
      return { title: "Stale Tasks", crumbs: ["Manager", "Stale"] };
    }
    if (nav.view === "team") {
      return { title: "Team", crumbs: ["Manager", "Team"] };
    }
    if (nav.view === "space" && nav.projectId) {
      const proj = projects.find((p) => p.id === nav.projectId);
      const subLabel = nav.subView === "list" ? "List" : "Board";
      return {
        title: proj ? proj.name : "Space",
        crumbs: ["Spaces", proj ? proj.key : "", subLabel],
      };
    }
    return { title: "Manager Portal", crumbs: [] };
  }

  const topBarProps = getTopBarProps();

  // TopBar right buttons for space view
  function getTopBarRight() {
    if (nav.view === "space" && nav.projectId) {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="secondary" size="sm" icon="user-plus" onClick={() => setManageMembersProjectId(nav.projectId)}>
            Manage members
          </Btn>
          <Btn kind="primary" size="sm" icon="plus" onClick={() => setCreateTaskOpen(true)}>
            New task
          </Btn>
        </div>
      );
    }
    return undefined;
  }

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
        tag="Managing Engineer"
        top={topItems}
        spaces={spaceItems}
        active={{ view: nav.view, projectId: nav.projectId, subView: nav.subView }}
        onNavigate={handleNavigate}
        onNewTask={() => setCreateTaskOpen(true)}
        footer={footer}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          crumbs={topBarProps.crumbs}
          title={topBarProps.title}
          right={getTopBarRight()}
        />

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {nav.view === "dashboard" && (
            <Dashboard
              onOpenTask={setOpenTaskId}
              goTo={(view) => setNav({ view, projectId: null, subView: "board" })}
            />
          )}
          {nav.view === "requests" && (
            <Approvals onOpenTask={setOpenTaskId} />
          )}
          {nav.view === "stale" && (
            <StaleTasks onOpenTask={setOpenTaskId} />
          )}
          {nav.view === "team" && (
            <Team onNewSpace={() => setCreateProjectOpen(true)} />
          )}
          {nav.view === "space" && nav.projectId && (
            <SpaceView
              projectId={nav.projectId}
              mode={nav.subView || "board"}
              onOpenTask={setOpenTaskId}
            />
          )}
        </div>
      </div>

      {/* Task detail modal (manager mode) */}
      {openTaskId && (
        <TaskDetailModal
          taskId={openTaskId}
          mode="manager"
          onClose={() => setOpenTaskId(null)}
        />
      )}

      {createTaskOpen && (
        <CreateTaskModal
          defaultProjectId={nav.view === "space" ? nav.projectId : null}
          onClose={() => setCreateTaskOpen(false)}
        />
      )}
      {manageMembersProjectId && (
        <ManageMembersModal
          projectId={manageMembersProjectId}
          onClose={() => setManageMembersProjectId(null)}
        />
      )}
      {createProjectOpen && (
        <CreateProjectModal onClose={() => setCreateProjectOpen(false)} />
      )}
    </div>
  );
}
