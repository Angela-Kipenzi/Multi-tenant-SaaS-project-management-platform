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
}): Promise<Issue> => {
  const wsId = getCurrentWorkspaceId();
  const r = await api.patch<Issue>(
    `/workspaces/${wsId}/issues/${args.issueId}/`,
    args
  );
  return r.data;
};