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
          <h1 className="text-2xl font-semibold text-slate-900">SaaS PM</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your workspace</p>
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