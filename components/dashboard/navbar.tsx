'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { SlideInMenu } from './slide-in-menu'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full border-0 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/airpublisher-logo.png?v=3"
              alt="AIR Publisher"
              width={673}
              height={371}
              className="h-16 w-auto"
            />
          </Link>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-white/70 hover:text-white transition-colors uppercase tracking-[0.4em] text-sm flex items-center gap-2"
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
        </div>
      </nav>
      <SlideInMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

