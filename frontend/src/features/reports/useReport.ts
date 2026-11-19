import { useQuery } from "@tanstack/react-query";
import { getBoardReport } from "@/services/reports";

export const reportKeys = {
    forBoard: (boardId: string) => ["report", boardId] as const,
};

export const useReport = (boardId: string) =>
    useQuery({
        queryKey: reportKeys.forBoard(boardId),
        queryFn: () => getBoardReport(boardId),
        enabled: !!boardId,
    });