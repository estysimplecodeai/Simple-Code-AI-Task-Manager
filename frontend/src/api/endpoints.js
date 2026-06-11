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
