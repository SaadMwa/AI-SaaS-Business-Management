import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, user, loading } = useAuth();

  // Critical: block rendering until we know if a token is valid.
  if (loading) return <div className="card">Loading...</div>;

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/login" replace />;

  return children;
}
