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