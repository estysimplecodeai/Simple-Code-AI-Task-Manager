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
