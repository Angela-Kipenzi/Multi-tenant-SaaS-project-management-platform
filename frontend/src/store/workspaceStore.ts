import { create } from "zustand";
import { setCurrentWorkspaceId } from "@/lib/api";
import type { Workspace, Role } from "@/types/api";

interface WorkspaceState {
  workspace: Workspace | null;
  role: Role | null;
  setWorkspace: (workspace: Workspace, role: Role) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  role: null,
  setWorkspace: (workspace, role) => {
    setCurrentWorkspaceId(workspace.id);
    set({ workspace, role });
  },
  clear: () => {
    setCurrentWorkspaceId(null);
    set({ workspace: null, role: null });
  },
}));