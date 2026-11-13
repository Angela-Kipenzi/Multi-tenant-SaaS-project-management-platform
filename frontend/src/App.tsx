import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, RequireWorkspace } from "@/components/ProtectedRoute";
import { Spinner } from "@/components/Spinner";
import { LoginPage } from "@/features/auth/LoginPage";
import { WorkspaceSelector } from "@/features/workspace/WorkspaceSelector";
import { refresh } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { BoardPage } from "@/features/boards/BoardPage";
import { BillingPage } from "@/features/billing/BillingPage"
import { NotFound } from "./pages/NotFound";

const App = () => {
  const { user, initialized, setAuth, clearAuth, setInitialized } = useAuthStore();

  // On boot, try to refresh the access token using the HttpOnly cookie.
  // If it succeeds, load /me and go to workspace selection.
  useEffect(() => {
    if (initialized) return;
    (async () => {
      try {
        const access = await refresh();
        // Temporarily set the token so /me can be called.
        useAuthStore.setState({ user: null });
        // Use a direct call (not through the axios instance to avoid 401 loop).
        const userResp = await fetch("/api/v1/auth/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!userResp.ok) throw new Error("me failed");
        const user = await userResp.json();
        setAuth(user, access);
      } catch {
        clearAuth();
      } finally {
        setInitialized(true);
      }
    })();
  }, [initialized, setAuth, clearAuth, setInitialized]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/select-workspace" element={<WorkspaceSelector />} />
        <Route element={<RequireWorkspace />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/boards" element={<BoardPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="*" element={<NotFound />} /> 
        </Route>
      </Route>

      <Route
        path="/"
        element={
          user ? <Navigate to="/select-workspace" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;