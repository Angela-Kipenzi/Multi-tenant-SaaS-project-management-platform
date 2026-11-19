import { api, getCurrentWorkspaceId } from "@/lib/api";
import type { BoardReport } from "@/types/api";

export const getBoardReport = async (boardId: string): Promise<BoardReport> => {
    const wsId = getCurrentWorkspaceId();
    const r = await api.get<BoardReport>(
        `/workspaces/${wsId}/boards/${boardId}/reports/`
    );
    return r.data;
};