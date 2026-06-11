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
