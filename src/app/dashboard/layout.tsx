import { AppHeader } from "@/components/layout/AppHeader"
import { BottomNav } from "@/components/layout/BottomNav"
import { Sidebar } from "@/components/layout/Sidebar"

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950 md:flex-row">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex flex-1 flex-col">
                {/* Top Header */}
                <AppHeader />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
