import { useQuery } from "@tanstack/react-query";
import { getSprintDetail } from "@/services/sprints";

export const sprintDetailKeys = {
    byId: (sprintId: string) => ["sprint", sprintId] as const,
};

export const useSprintDetail = (sprintId: string) =>
    useQuery({
        queryKey: sprintDetailKeys.byId(sprintId),
        queryFn: () => getSprintDetail(sprintId),
        enabled: !!sprintId,
    });