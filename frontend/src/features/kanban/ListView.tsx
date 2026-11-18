import { useState, useMemo } from "react";
import { Avatar } from "@/components/Avatar";
import { priorityMeta } from "@/lib/priority";
import type { Issue } from "@/types/api";

interface Props {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

type SortField = "key" | "title" | "priority" | "status" | "created_at";

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

export const ListView = ({ issues, onIssueClick }: Props) => {
  const [sort, setSort] = useState<{ field: SortField; dir: "asc" | "desc" }>({
    field: "created_at",
    dir: "desc",
  });

  const sorted = useMemo(() => {
    const copy = [...issues];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sort.field === "key") cmp = a.key.localeCompare(b.key);
      else if (sort.field === "title") cmp = a.title.localeCompare(b.title);
      else if (sort.field === "priority")
        cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      else if (sort.field === "status") cmp = a.status.localeCompare(b.status);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [issues, sort]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      onClick={() =>
        setSort((s) => ({
          field,
          dir: s.field === field && s.dir === "asc" ? "desc" : "asc",
        }))
      }
      className="cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
    >
      {label}
      {sort.field === field && (
        <span className="ml-1 text-slate-400">{sort.dir === "asc" ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <SortHeader field="key" label="Key" />
            <SortHeader field="title" label="Title" />
            <SortHeader field="priority" label="Priority" />
            <SortHeader field="status" label="Status" />
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignee
            </th>
            <SortHeader field="created_at" label="Created" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((issue) => (
            <tr
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <td className="px-3 py-2 font-mono text-xs text-slate-500">{issue.key}</td>
              <td className="px-3 py-2 text-sm text-slate-900">{issue.title}</td>
              <td className="px-3 py-2">
                <span className={`text-xs font-medium capitalize ${priorityMeta[issue.priority]?.color}`}>
                  {issue.priority}
                </span>
              </td>
              <td className="px-3 py-2 text-xs capitalize text-slate-600">
                {issue.status.replace("_", " ")}
              </td>
              <td className="px-3 py-2">
                {issue.assignee_email ? (
                  <Avatar email={issue.assignee_email} size={22} />
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {new Date(issue.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-12 text-center text-sm text-slate-500">
                No issues match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};