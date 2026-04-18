import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex w-full items-center justify-between border-b border-zinc-800 bg-black/50 p-6 px-10 backdrop-blur-md">
        <div className="text-xl font-bold tracking-widest text-cyan-400">NEONAUTH</div>
        <div className="flex gap-4">
          <Link href="/login">
            <button className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-6 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-semibold text-black shadow-[0_0_15px_rgba(0,255,255,0.4)] transition hover:bg-cyan-400">
              Register
            </button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <h1 className="mb-6 max-w-4xl bg-gradient-to-r from-white via-cyan-100 to-cyan-500 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">
          #
        </h1>
        <p className="max-w-2xl text-xl text-zinc-400">
          secure authentication system built with Next.js, Prisma, and Neon PostgreSQL.
          provides login, registration, JWT-based sessions, and password recovery with email support.
        </p>
      </main>
    </div>
  );
}
