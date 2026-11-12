import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export const ProtectedRoute = () => {
  const { user, initialized } = useAuthStore();
  if (!initialized) return null; // bootstrap in progress
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const RequireWorkspace = () => {
  const { workspace } = useWorkspaceStore();
  if (!workspace) return <Navigate to="/select-workspace" replace />;
  return <Outlet />;
};