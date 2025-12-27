import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-neutral-950">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <path d="m19 11-8-8-8 8" /><path d="M20 12h-4l-3 9L9 12H4l8-8Z" />
          </svg>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
            GearPack
          </h1>
        </div>

        {/* Tagline */}
        <p className="max-w-md text-lg text-neutral-600 dark:text-neutral-400 sm:text-xl">
          The ultimate companion for hikers and backpackers. Manage your gear, plan your trips, and hit the trail with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 bg-white px-8 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-neutral-500 dark:text-neutral-400">
        &copy; {new Date().getFullYear()} GearPack. Built for the outdoors.
      </footer>
    </div>
  );
}
