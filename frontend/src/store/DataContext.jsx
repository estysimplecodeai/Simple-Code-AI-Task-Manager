import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UsersApi, ProjectsApi, TasksApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { toast } from "../components/ui/Toast";

const Ctx = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const calls = [ProjectsApi.list(), TasksApi.list()];
      if (user?.role === "manager") calls.push(UsersApi.list());
      const [p, t, u] = await Promise.all(calls);
      setProjects(p.projects); setTasks(t.tasks);
      if (u) setUsers(u.users);
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to load data", "danger");
    } finally {
      setReady(true);
    }
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
