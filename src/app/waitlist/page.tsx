import Link from 'next/link'
import Image from 'next/image'
import { Compass, Mountain, ShieldCheck, Users } from 'lucide-react'
import { getWaitlistCount } from '@/app/actions/waitlist'
import { WaitlistSignup } from '@/components/waitlist/WaitlistSignup'

export const dynamic = 'force-dynamic'

export default async function WaitlistPage() {
    const count = await getWaitlistCount()

    return (
        <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            <Image
                src="/header1.jpg"
                alt="Backpacking trail at sunrise"
                fill
                priority
                sizes="100vw"
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-neutral-950/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 via-neutral-950/10 to-neutral-950/80" />

            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <Image src="/logo-dark.svg" alt="GearPack" width={139} height={36} className="h-9 w-auto" />
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-neutral-950"
                    >
                        Sign in
                    </Link>
                </header>

                <section className="flex flex-1 items-center px-5 pb-12 pt-8 sm:px-8 lg:px-12">
                    <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_28rem]">
                        <div className="max-w-3xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-emerald-100 backdrop-blur">
                                <Compass className="h-4 w-4" />
                                Early access is opening soon
                            </div>
                            <h1 className="font-heading text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                                GearPack waitlist
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-100 sm:text-xl">
                                Join the first wave of hikers organizing gear, trips, shared packing lists, and trail plans in one place.
                            </p>

                            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                                    <Mountain className="mb-3 h-5 w-5 text-emerald-200" />
                                    <p className="text-sm font-semibold">Trip planning</p>
                                </div>
                                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                                    <ShieldCheck className="mb-3 h-5 w-5 text-sky-200" />
                                    <p className="text-sm font-semibold">Shared gear clarity</p>
                                </div>
                                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                                    <Users className="mb-3 h-5 w-5 text-amber-200" />
                                    <p className="text-sm font-semibold">Friend-ready packs</p>
                                </div>
                            </div>
                        </div>

                        <WaitlistSignup initialCount={count} />
                    </div>
                </section>
            </div>
        </main>
    )
}
