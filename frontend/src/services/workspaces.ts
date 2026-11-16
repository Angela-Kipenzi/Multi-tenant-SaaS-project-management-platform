import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { Membership } from "@/types/api";

export const listMyMemberships = async () => {
  const r = await api.get<Membership[]>("/me/memberships/");
  return r.data;
};

export interface Member {
  id: string;
  user: { id: string; email: string };
  role: string;
  created_at: string;
}

export const listMembers = async (): Promise<Member[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Member[]>(`/workspaces/${wsId}/members/`);
  return r.data;
};