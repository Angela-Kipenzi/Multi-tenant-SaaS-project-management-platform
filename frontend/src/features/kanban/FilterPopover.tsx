import { useEffect, useRef, useState } from "react";
import type { IssuePriority } from "@/types/api";

export interface Filters {
  priorities: IssuePriority[];
  assignees: string[]; // "unassigned" for null assignee
}

const empty: Filters = { priorities: [], assignees: [] };

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  availableAssignees: { id: string; email: string }[];
}

const priorities: IssuePriority[] = ["urgent", "high", "medium", "low"];

export const FilterPopover = ({ filters, onChange, availableAssignees }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const togglePriority = (p: IssuePriority) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((x) => x !== p)
      : [...filters.priorities, p];
    onChange({ ...filters, priorities: next });
  };

  const toggleAssignee = (id: string) => {
    const next = filters.assignees.includes(id)
      ? filters.assignees.filter((x) => x !== id)
      : [...filters.assignees, id];
    onChange({ ...filters, assignees: next });
  };

  const activeCount = filters.priorities.length + filters.assignees.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition ${
          activeCount > 0
            ? "border-brand-200 bg-brand-50 text-brand-700"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter
        {activeCount > 0 && (
          <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-medium text-white">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">Priority</p>
            <div className="space-y-1">
              {priorities.map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.priorities.includes(p)}
                    onChange={() => togglePriority(p)}
                    className="rounded border-slate-300"
                  />
                  <span className="capitalize text-slate-700">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">Assignee</p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.assignees.includes("unassigned")}
                  onChange={() => toggleAssignee("unassigned")}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-700">Unassigned</span>
              </label>
              {availableAssignees.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.assignees.includes(a.id)}
                    onChange={() => toggleAssignee(a.id)}
                    className="rounded border-slate-300"
                  />
                  <span className="truncate text-slate-700">{a.email}</span>
                </label>
              ))}
            </div>
          </div>
          {activeCount > 0 && (
            <button
              onClick={() => onChange(empty)}
              className="w-full rounded border border-slate-200 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};