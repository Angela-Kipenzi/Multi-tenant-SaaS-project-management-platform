import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/Modal";
import type { Issue } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  onSelect: (issue: Issue) => void;
}

export const SearchModal = ({ open, onClose, issues, onSelect }: Props) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return issues.slice(0, 8);
    const q = query.toLowerCase();
    return issues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }, [query, issues]);

  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="-m-4 mb-3 border-b border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues by title, key, or description…"
            className="flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500">ESC</span>
        </div>
      </div>

      <div className="max-h-96 -m-4 overflow-y-auto">
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No issues found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {results.map((issue) => (
              <li key={issue.id}>
                <button
                  onClick={() => {
                    onSelect(issue);
                    onClose();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{issue.key}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase">{issue.priority}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{issue.title}</p>
                  {issue.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{issue.description}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};