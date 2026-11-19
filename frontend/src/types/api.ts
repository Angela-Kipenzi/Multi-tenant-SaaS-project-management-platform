export type Role = "owner" | "admin" | "member" | "viewer";
export type Plan = "free" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  initials: string;
  active_workspace: string | null;
  date_joined: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user: { id: string; email: string };
  role: Role;
  created_at: string;
}

export interface Membership {
  workspace: Workspace;
  role: Role;
  membership_id: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  name: string;
  order: number;
}

export interface Board {
  id: string;
  project: string;
  name: string;
  columns: Column[];
  created_at: string;
}

export type IssueStatus = "todo" | "in_progress" | "review" | "done";
export type IssuePriority = "low" | "medium" | "high" | "urgent";
export interface Filters {
  priorities: IssuePriority[];
  assignees: string[];
}

export interface Issue {
  id: string;
  key: string;
  number: number;
  project: string;
  board: string;
  column: string;
  sprint: string | null;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string | null;
  assignee_email: string | null;
  assignee_display_name: string | null;
  assignee_initials: string | null;
  reporter: string | null;
  reporter_email: string | null;
  reporter_display_name: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ReportBucket {
  key: string;
  label: string;
  count: number;
}

export interface ReportAssigneeBucket {
  key: string;
  email: string;
  count: number;
}

export interface BoardReport {
  total: number;
  done: number;
  completion_pct: number;
  by_status: ReportBucket[];
  by_priority: ReportBucket[];
  by_assignee: ReportAssigneeBucket[];
  by_column: Record<string, number>;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  project: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export type SprintStatus = "planned" | "active" | "completed" | "overdue";

export interface SprintMetrics {
  total: number;
  done: number;
  remaining: number;
  completion_pct: number;
  points_total: number;
  points_done: number;
}

export interface SprintStatusBreakdown {
  todo: number;
  in_progress: number;
  review: number;
  done: number;
}

export interface SprintMemberContribution {
  user: {
    id: string;
    email: string;
    display_name: string;
    initials: string;
  };
  assigned: number;
  completed: number;
}

export interface SprintIssueBrief {
  id: string;
  key: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee_id: string | null;
  assignee_email: string | null;
}

export interface SprintDetail {
  id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  days_left: number | null;
  is_active: boolean;
  project_id: string;
  project_name: string;
  metrics: SprintMetrics;
  status_breakdown: SprintStatusBreakdown;
  members: SprintMemberContribution[];
  issues: SprintIssueBrief[];
}