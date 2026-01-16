import Link from 'next/link'
import { ArrowRight, TrendingUp, Calendar, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary font-extrabold text-xl">A</span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground">AIR PUBLISHER</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-foreground/80 hover:text-primary font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="bg-primary text-background px-6 py-3 rounded-xl font-bold hover:bg-primary-dark hover:shadow-glow-sm transition-all border-2 border-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight">
            YOUR CREATOR OS
            <br />
            <span className="text-primary">PUBLISHING PLATFORM</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 mb-12 max-w-3xl mx-auto font-semibold leading-relaxed">
            Publish, schedule, and track your content across platforms. Compete
            on leaderboards and grow your creator empire.
          </p>
          <div className="flex gap-6 justify-center items-center flex-wrap">
            <Link
              href="/dashboard"
              className="bg-primary text-background px-10 py-5 rounded-xl text-lg font-bold hover:bg-primary-dark transition-all hover:shadow-glow flex items-center gap-3 group border-2 border-primary"
            >
              Start Publishing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/leaderboard"
              className="bg-card border-2 border-primary/50 px-10 py-5 rounded-xl text-lg font-bold hover:bg-card-hover hover:border-primary transition-all flex items-center gap-3"
            >
              <BarChart3 className="w-5 h-5" />
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card-elevated p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-card-hover transition-all group">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold mb-4">Smart Scheduling</h3>
            <p className="text-foreground/80 text-base leading-relaxed font-medium">
              Schedule posts across YouTube, Instagram, TikTok, and more. Never
              miss an optimal posting time.
            </p>
          </div>
          <div className="bg-card-elevated p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-card-hover transition-all group">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold mb-4">Performance Tracking</h3>
            <p className="text-foreground/80 text-base leading-relaxed font-medium">
              Monitor views, likes, comments, and revenue. Get insights that
              drive growth.
            </p>
          </div>
          <div className="bg-card-elevated p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-card-hover transition-all group">
            <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold mb-4">Leaderboards</h3>
            <p className="text-foreground/80 text-base leading-relaxed font-medium">
              Compete with creators in your niche. Climb the ranks and earn your
              spot at the top.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

