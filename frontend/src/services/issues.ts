import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { Issue, IssuePriority } from "@/types/api";

export const listIssues = async (boardId: string): Promise<Issue[]> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Issue[]>(
    `/workspaces/${wsId}/boards/${boardId}/issues/`
  );
  return r.data;
};

export const createIssue = async (args: {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: IssuePriority;
}): Promise<Issue> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Issue>(
    `/workspaces/${wsId}/boards/${args.boardId}/issues/`,
    {
      column_id: args.columnId,
      title: args.title,
      description: args.description ?? "",
      priority: args.priority ?? "medium",
    }
  );
  return r.data;
};

export const getIssue = async (issueId: string): Promise<Issue> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.get<Issue>(`/workspaces/${wsId}/issues/${issueId}/`);
  return r.data;
};

export const moveIssue = async (args: {
  issueId: string;
  columnId: string;
  order: number;
  expectedUpdatedAt: string;
}): Promise<Issue> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.post<Issue>(
    `/workspaces/${wsId}/issues/${args.issueId}/move/`,
    {
      column_id: args.columnId,
      order: args.order,
      expected_updated_at: args.expectedUpdatedAt,
    }
  );
  return r.data;
};

export const updateIssue = async (args: {
  issueId: string;
  title?: string;
  description?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
}): Promise<Issue> => {
  const wsId = getCurrentWorkspaceId();
  const payload: Record<string, unknown> = {};
  if (args.title !== undefined) payload.title = args.title;
  if (args.description !== undefined) payload.description = args.description;
  if (args.priority !== undefined) payload.priority = args.priority;
  if (args.assigneeId !== undefined) payload.assignee_id = args.assigneeId;

  const r = await api.patch<Issue>(
    `/workspaces/${wsId}/issues/${args.issueId}/`,
    payload
  );
  return r.data;
};

export const deleteIssue = async (issueId: string): Promise<void> => {
  const wsId = getCurrentWorkspaceId();
  await api.delete(`/workspaces/${wsId}/issues/${issueId}/`);
};

export const searchIssues = async (args: {
  boardId?: string;
  query: string;
  priority?: string;
  assignee?: string;
}): Promise<Issue[]> => {
  const wsId = getCurrentWorkspaceId();
  const params = new URLSearchParams();
  if (args.query) params.set("search", args.query);
  if (args.priority) params.set("priority", args.priority);
  if (args.assignee) params.set("assignee", args.assignee);
  const path = args.boardId
    ? `/workspaces/${wsId}/boards/${args.boardId}/issues/`
    : `/workspaces/${wsId}/issues/search/`;
  const r = await api.get<Issue[]>(`${path}?${params.toString()}`);
  return r.data;
};