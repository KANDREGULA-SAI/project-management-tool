export type Task = {
  id: number;
  project: number;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status:
    | "BACKLOG"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "BLOCKED"
    | "DONE";
  previous_status: string | null;
  due_date: string | null;
  blocking_tasks: number[];
  assignees: number[];
  created_by: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: number;
  key: string;
  name: string;
  description: string;
  owner: number;
  owner_email: string;
  members: number[];
  is_archived: boolean;
};