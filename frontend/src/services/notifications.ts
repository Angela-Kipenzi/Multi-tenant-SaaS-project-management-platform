import { api, getCurrentWorkspaceId } from "@/lib/api";

export interface Notification {
  id: string;
  kind: string;
  issue: string | null;
  issue_key: string | null;
  actor_email: string | null;
  actor_display_name: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const listNotifications = async (
  unreadOnly = false
): Promise<Notification[]> => {
  const wsId = getCurrentWorkspaceId();
  const url = unreadOnly
    ? `/workspaces/${wsId}/notifications/?unread=true`
    : `/workspaces/${wsId}/notifications/`;
  const r = await api.get<Notification[]>(url);
  return r.data;
};

export const markNotificationRead = async (
  notificationId: string
): Promise<void> => {
  const wsId = getCurrentWorkspaceId();
  await api.post(`/workspaces/${wsId}/notifications/${notificationId}/read/`);
};