import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export const RegisterPage = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");

    const mutation = useMutation({
        mutationFn: async () => {
            const r = await api.post("/auth/register/", {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });
            return r.data;
        },
        onSuccess: (data) => {
            setAuth(data.user, data.access);
            navigate("/select-workspace", { replace: true });
        },
        onError: (err: any) => {
            setError(err?.response?.data?.detail ?? "Couldn't create account.");
        },
    });

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!firstName.trim()) {
            setError("First name is required.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }
        if (password.length < 12) {
            setError("Password must be at least 12 characters.");
            return;
        }
        setError("");
        mutation.mutate();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
                    <p className="mt-1 text-sm text-slate-500">Start managing your team</p>
                </div>

                <form onSubmit={onSubmit} className="card space-y-4 p-6">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="First name"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <Input
                            label="Last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        required
                        minLength={12}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 12 characters"
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <Button type="submit" loading={mutation.isPending} className="w-full">
                        Create account
                    </Button>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};