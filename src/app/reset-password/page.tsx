"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) {
      setError("Invalid reset link. Missing email or token.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(data.message || "Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-black/50 p-8 pt-10 shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] backdrop-blur-xl">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-sm">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-zinc-400">Enter your new password below</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-center text-sm text-red-500">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 rounded-lg border border-green-900/50 bg-green-900/20 p-3 text-center text-sm text-green-500">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-300">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-300">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(234,179,8,0.3)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? "Processing..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black p-4">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
