import { Suspense } from 'react'
import { AppHeader } from "@/components/layout/AppHeader"
import { BottomNav } from "@/components/layout/BottomNav"
import { Sidebar } from "@/components/layout/Sidebar"
import { AIChat } from "@/components/ai/AIChat"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <Suspense fallback={null}>
                <AIChat />
            </Suspense>
            <div className="relative flex min-h-screen flex-col bg-neutral-50/50 dark:bg-neutral-950 md:flex-row overflow-hidden font-sans">
                {/* Background Auroras (Fixed) */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-100/50 blur-[100px] animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-100/40 blur-[100px] animate-pulse-slow delay-1000" />
                </div>

                {/* Desktop Sidebar (Z-20 to sit above background) */}
                <div className="z-20 hidden md:flex h-screen">
                    <Sidebar />
                </div>

                <div className="relative z-10 flex flex-1 flex-col h-screen overflow-hidden">
                    {/* Top Header */}
                    <AppHeader />

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="z-20 md:hidden">
                    <BottomNav />
                </div>
            </div>
        </>
    )
}
