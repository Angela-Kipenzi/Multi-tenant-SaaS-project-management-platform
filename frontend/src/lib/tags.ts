const TAG_COLORS: Record<string, string> = {
  design: "bg-purple-100 text-purple-700",
  frontend: "bg-sky-100 text-sky-700",
  backend: "bg-emerald-100 text-emerald-700",
  research: "bg-amber-100 text-amber-700",
  bug: "bg-red-100 text-red-700",
  docs: "bg-slate-100 text-slate-700",
  mobile: "bg-indigo-100 text-indigo-700",
  infra: "bg-teal-100 text-teal-700",
};

export const tagColor = (tag: string): string => {
  const key = tag.toLowerCase().trim();
  if (TAG_COLORS[key]) return TAG_COLORS[key];
  // Deterministic fallback from tag name
  const palette = [
    "bg-purple-100 text-purple-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
  ];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};