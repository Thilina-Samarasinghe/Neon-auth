"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<"email" | "verify" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const urlEmail = searchParams.get("email");

    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
      verifyToken(urlToken, urlEmail);
    }
  }, [searchParams]);

  const verifyToken = async (t: string, e: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register/verify?token=${t}&email=${e}`);
      const data = await res.json();
      if (data.success) {
        setStep("password");
        setSuccess("Email verified successfully! Please set your password.");
      } else {
        setError(data.message || "Invalid or expired verification link.");
        setStep("email");
      }
    } catch (err) {
      setError("Failed to verify token.");
      setStep("email");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("verify");
        setSuccess("Verification email sent! Please check your inbox.");
      } else {
        setError(data.message || "Failed to send verification email");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{6,})/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 6 characters and contain one capital letter and one symbol.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-black/50 p-8 pt-10 shadow-[0_0_50px_-12px_rgba(0,255,255,0.15)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-sm">
            {step === "password" ? "Set Password" : "Register"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {step === "email" && "Join the secure platform"}
            {step === "verify" && "Check your inbox to continue"}
            {step === "password" && "Complete your registration"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-cyan-900/50 bg-cyan-900/20 p-3 text-center text-sm text-cyan-400">
            {success}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? "Sending Link..." : "Send Verification Link"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-cyan-500/10 p-3 ring-1 ring-cyan-500/20">
                <svg className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-zinc-300">We've sent a verification link to <span className="text-white font-medium">{email}</span>.</p>
            <button
              onClick={() => setStep("email")}
              className="mt-6 text-sm text-cyan-400 hover:underline"
            >
              Didn't get the email? Try again
            </button>
          </div>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pr-10 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition duration-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? "Completing Setup..." : "Complete Registration"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
