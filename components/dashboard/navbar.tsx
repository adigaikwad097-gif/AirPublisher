

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { SlideInMenu } from './slide-in-menu'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full border-0 bg-black/80 backdrop-blur-sm">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-white/70 hover:text-white transition-colors uppercase tracking-widest text-sm font-medium flex items-center gap-2"
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

