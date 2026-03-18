import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="space-y-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Dialectic</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Sharpen your thinking through structured debate.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 text-sm font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
