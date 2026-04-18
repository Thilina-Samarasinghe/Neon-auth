"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/dashboard");
    } else {
      // Attempt silent refresh
      fetch("/api/auth/refresh-token", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.accessToken) {
            localStorage.setItem("accessToken", data.data.accessToken);
            router.push("/dashboard");
          }
        })
        .catch(() => {});
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("accessToken", data.data.accessToken);
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-black/50 p-8 pt-10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-sm">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Log in to your NeonAuth dashboard</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-300">Password</label>
              <a href="/forgot-password" className="text-xs font-medium text-purple-400 hover:text-purple-300">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <a href="/register" className="font-semibold text-purple-400 hover:text-purple-300">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
