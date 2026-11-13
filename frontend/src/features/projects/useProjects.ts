import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, listProjects } from "@/services/projects";

export const projectKeys = {
  all: ["projects"] as const,
};

export const useProjects = () =>
  useQuery({
    queryKey: projectKeys.all,
    queryFn: listProjects,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { name: string; key: string; description?: string }) =>
      createProject(args.name, args.key, args.description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};