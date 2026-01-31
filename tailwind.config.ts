import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Banking dashboard theme - professional dark theme (matching Bye.bank)
        background: '#0a0a0f', // Near-black charcoal base
        foreground: '#EDEDED', // Muted off-white text
        primary: {
          DEFAULT: '#89CFF0', // Light baby blue accent
          dark: '#7ab8d9',
          light: '#9dd5f5',
          glow: '#89CFF0',
        },
        accent: {
          DEFAULT: '#89CFF0',
          dark: '#7ab8d9',
        },
        card: {
          DEFAULT: '#0f0f14', // Soft matte dark surface, blends with background
          hover: '#141419', // Very subtle hover state
          elevated: '#0a0a0f', // Even darker for elevated cards
        },
        border: '#1a1a1f', // Very subtle borders (almost invisible)
        muted: '#9ca3af', // Cool gray for secondary text
        success: '#10b981', // Green for success
        warning: '#f59e0b', // Amber for warnings
        error: '#ef4444', // Red for errors
        // Additional card accent colors (like the bills section)
        purple: {
          light: '#a78bfa', // Light purple for cards
          DEFAULT: '#8b5cf6',
        },
        teal: {
          light: '#5eead4', // Light teal for cards
          DEFAULT: '#14b8a6',
        },
        gray: {
          light: '#9ca3af', // Light grey for cards
          DEFAULT: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-sm': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-sm': '0 0 10px rgba(251, 191, 36, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config

