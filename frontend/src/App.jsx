import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <div style={{ padding: 40, fontFamily: "var(--font-body)" }}>
        Simple Code AI — frontend foundation ready.
      </div>
    </AuthProvider>
  );
}
