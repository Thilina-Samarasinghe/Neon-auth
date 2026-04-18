"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        // Try to refresh token
        const res = await fetch("/api/auth/refresh-token", { method: "POST" });
        const data = await res.json();
        if (data.success && data.data?.accessToken) {
          token = data.data.accessToken;
          localStorage.setItem("accessToken", token!);
        } else {
          router.push("/login");
          return;
        }
      }

      // Verify token with /me endpoint
      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();
      
      if (!meRes.ok) {
        localStorage.removeItem("accessToken");
        router.push("/login");
      } else {
        setUserEmail(meData.data.user.email);
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("accessToken");
      router.push("/login");
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black p-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-black/50 p-10 text-center shadow-[0_0_50px_-12px_rgba(34,197,94,0.15)] backdrop-blur-xl">
        <h1 className="mb-4 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          Dashboard
        </h1>
        <p className="mb-2 text-zinc-400">
          Welcome back, <span className="font-semibold text-emerald-400">{userEmail}</span>
        </p>
        <p className="mb-10 text-zinc-500 text-sm">
          You are securely authenticated.
        </p>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="rounded-full border border-zinc-700 bg-zinc-900 px-8 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {loading ? "Logging out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
