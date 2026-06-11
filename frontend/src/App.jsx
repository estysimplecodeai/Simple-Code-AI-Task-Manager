import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { DataProvider } from "./store/DataContext";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import { ToastHost } from "./components/ui/Toast";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // TODO(Phase 5): render <ManagerApp/> or <DeveloperApp/> by role, wrapped in <DataProvider>.
  return (
    <DataProvider>
      <div style={{ padding: 40, fontFamily: "var(--font-body)" }}>
        Signed in as {user.name} ({user.role}). Portal coming in Phase 5.
        <button onClick={() => { localStorage.removeItem("scai_token"); location.assign("/login"); }} style={{ marginLeft: 12 }}>Log out</button>
      </div>
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
