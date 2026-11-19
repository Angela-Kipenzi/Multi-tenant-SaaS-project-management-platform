import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateSprint,
  closeSprint,
  createSprint,
  listSprints,
  deleteSprint,
} from "@/services/sprints";
import { toast } from "@/lib/toast";

export const sprintKeys = {
  forProject: (projectId: string) => ["sprints", projectId] as const,
};

export const useSprints = (projectId: string) =>
  useQuery({
    queryKey: sprintKeys.forProject(projectId),
    queryFn: () => listSprints(projectId),
    enabled: !!projectId,
  });

export const useCreateSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      name: string;
      goal?: string;
      startDate?: string | null;
      endDate?: string | null;
    }) => createSprint({ projectId, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint created.", "success");
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      const code = err?.response?.data?.code;
      toast(
        code === "sprint_name_taken"
          ? "A sprint with that name already exists."
          : detail ?? "Couldn't create sprint.",
        "error"
      );
    },
  });
};

export const useActivateSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateSprint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint activated.", "success");
    },
  });
};

export const useCloseSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: closeSprint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint closed. Incomplete issues returned to backlog.", "success");
    },
    onError: () => toast("Couldn't close sprint.", "error"),
  });
};

export const useDeleteSprint = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSprint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.forProject(projectId) });
      toast("Sprint deleted.", "success");
    },
    onError: (err: any) => {
      toast(
        err?.response?.data?.detail ?? "Couldn't delete sprint.",
        "error"
      );
    },
  });
};