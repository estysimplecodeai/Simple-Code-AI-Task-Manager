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
