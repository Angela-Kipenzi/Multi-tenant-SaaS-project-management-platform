type ToastKind = "info" | "error" | "success";

export const toast = (message: string, kind: ToastKind = "info") => {
  const el = document.createElement("div");
  el.textContent = message;
  el.className = `fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-opacity duration-300 ${
    kind === "error"
      ? "bg-red-600 text-white"
      : kind === "success"
      ? "bg-emerald-600 text-white"
      : "bg-slate-900 text-white"
  }`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
};