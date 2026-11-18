import { useQuery } from "@tanstack/react-query";
import { api, getCurrentWorkspaceId } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Issue } from "@/types/api";

export const useMyTasks = () => {
    const { user } = useAuthStore();
    const wsId = getCurrentWorkspaceId();

    return useQuery({
        queryKey: ["my-tasks", wsId, user?.id],
        queryFn: async () => {
            const projectsResp = await api.get<{ id: string }[]>(
                `/workspaces/${wsId}/projects/`
            );
            const allIssues: Issue[] = [];
            for (const project of projectsResp.data) {
                const boardsResp = await api.get<{ id: string }[]>(
                    `/workspaces/${wsId}/projects/${project.id}/boards/`
                );
                for (const board of boardsResp.data) {
                    const issuesResp = await api.get<Issue[]>(
                        `/workspaces/${wsId}/boards/${board.id}/issues/`
                    );
                    allIssues.push(...issuesResp.data);
                }
            }
            return allIssues.filter((i) => i.assignee === user?.id);
        },
        enabled: !!user && !!wsId,
        staleTime: 60_000,
    });
};