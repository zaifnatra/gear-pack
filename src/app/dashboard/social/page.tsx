export default function SocialPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Social Hub</h1>
            <p className="max-w-md text-neutral-500">
                Connect with hikers, share your gear lists, and plan group trips together.
                <br />
                <span className="text-sm italic opacity-75">(Coming Soon)</span>
            </p>
        </div>
    )
}
