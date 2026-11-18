import type { IssuePriority } from "@/types/api";

export const priorityMeta: Record<
  IssuePriority,
  { label: string; color: string; icon: string }
> = {
  low: { label: "Low", color: "text-slate-400", icon: "chevron-down" },
  medium: { label: "Medium", color: "text-blue-500", icon: "minus" },
  high: { label: "High", color: "text-orange-500", icon: "chevron-up" },
  urgent: { label: "Urgent", color: "text-red-600", icon: "alert" },
};