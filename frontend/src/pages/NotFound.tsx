import { Link } from "react-router-dom";

export const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <p className="mt-2 text-slate-600">Page not found</p>
      <Link
        to="/projects"
        className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Back to projects
      </Link>
    </div>
  </div>
);