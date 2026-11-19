import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { login } from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.access);
      navigate("/select-workspace", { replace: true });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-8 w-8"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 10 L20 10 L28 18 L28 22 L24 22 L16 14 L10 14 Z"
                fill="#3b82f6"
              />
              <path
                d="M6 18 L16 18 L24 26 L24 30 L20 30 L12 22 L6 22 Z"
                fill="#2563eb"
              />
              <path
                d="M4 26 L14 26 L22 34 L22 38 L18 38 L10 30 L4 30 Z"
                fill="#1e40af"
              />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              FlowForge
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">Sign in to your workspace</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mutation.isError && (
            <p className="text-sm text-red-600">Invalid email or password.</p>
          )}

          <Button type="submit" loading={mutation.isPending} className="w-full">
            Sign in
          </Button>
          <p className="mt-4 text-center text-sm text-slate-500">
            No account?{" "}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};