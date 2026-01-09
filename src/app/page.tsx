
import Link from "next/link";
import { Typewriter } from "@/components/ui/typewriter-text";
import { FeaturesGallery } from "@/components/landing/FeaturesGallery";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">

      {/* Background Auroras (Light Mode) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-100/60 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-100/60 blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-emerald-50/60 blur-[120px] animate-pulse-slow delay-2000" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">

        {/* Navigation / Header */}
        <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <img src="/logo-light.svg" alt="Gear-Pack" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Log In</Link>
            <Link href="/login" className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-all shadow-lg shadow-neutral-200">Get Started</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex flex-col items-center max-w-5xl mx-auto text-center mt-12 sm:mt-24">


          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 text-neutral-900 drop-shadow-sm h-[1.25em] sm:h-[1.5em] md:h-auto flex flex-col items-center justify-start">
            Packing Made<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              <Typewriter
                text={["Effortless.", "Smart.", "Yours."]}
                speed={100}
                deleteSpeed={60}
                delay={2000}
                loop={true}
                cursor="|"
              />
            </span>
          </h1>

          <p className="max-w-xl text-lg sm:text-xl text-neutral-500 mb-10 leading-relaxed font-medium">
            Manage your gear closet, plan trips, and share lists with friends. The convenient way to organize your outdoor life.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/dashboard" className="px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
              Launch App
            </Link>
          </div>
        </main>

        {/* Feature Gallery */}
        <FeaturesGallery />

        <footer className="mt-32 mb-12 text-center text-neutral-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Gear-Pack.</p>
        </footer>
      </div>
    </div>
  );
}

