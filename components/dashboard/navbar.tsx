import { Menu } from 'lucide-react'

interface NavbarProps {
  onMenuOpen: () => void
}

export function Navbar({ onMenuOpen }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-white/[0.06]">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-5 flex items-center justify-between">
        <button
          onClick={onMenuOpen}
          className="text-white/70 hover:text-white transition-colors uppercase tracking-widest text-base font-semibold flex items-center gap-3"
        >
          <Menu className="h-6 w-6" />
          Menu
        </button>
      </div>
    </nav>
  )
}
