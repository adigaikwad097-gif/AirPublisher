import Link from 'next/link'
import Image from 'next/image'
import { HeroBoxes } from '@/components/HeroBoxes'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 z-50 w-full border-0 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 text-white/70">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src="/creatorjoy-logo.webp"
                alt="CreatorJoy Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm uppercase tracking-[0.4em]">
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full bg-white text-black text-sm uppercase tracking-[0.4em] hover:bg-white/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen w-screen overflow-visible bg-black">
        {/* BOXES LAYOUT */}
        <HeroBoxes />

        {/* BIG WORD */}
        <h1
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-[4vw]
            right-[4vw]
            text-[22vw]
            font-extrabold
            tracking-tight
            whitespace-nowrap
            select-none
            pointer-events-none
            leading-[0.9]
            text-[#89CFF0]
            z-20
          "
        >
          pu
          <img
            src="/b.png"
            alt="b"
            className="inline-block align-baseline"
            style={{
              height: '0.9em',
              width: 'auto',
              verticalAlign: 'baseline',
              margin: 0,
              padding: 0,
              marginLeft: '-0.4em',
              marginRight: '-0.4em',
              display: 'inline-block',
              lineHeight: 0,
              fontSize: 'inherit',
              transform: 'translate(0.15cm, 1.11cm)'
            }}
          />
          lisher
        </h1>

        {/* SMALL WORD */}
        <span 
          className="
            absolute
            left-[4vw]
            bottom-[12vw]
            text-[22vw]
            font-extrabold
            tracking-tight
            whitespace-nowrap
            select-none
            pointer-events-none
            leading-[0.9]
            text-white
            z-30
          "
          style={{
            transform: 'translateY(-1cm)'
          }}
        >
          air
        </span>

      </section>
    </div>
  )
}

