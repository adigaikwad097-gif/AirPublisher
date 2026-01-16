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
        background: '#0f172a', // Dark blue like CreatorJoy
        foreground: '#ffffff',
        primary: {
          DEFAULT: '#00bfff', // Light blue accent like CreatorJoy
          dark: '#0099cc',
          light: '#33ccff',
          glow: '#00bfff',
        },
        accent: {
          DEFAULT: '#00bfff',
          dark: '#0099cc',
        },
        card: {
          DEFAULT: '#1e293b', // Dark blue-gray
          hover: '#334155',
          elevated: '#0f172a',
        },
        border: '#334155',
        muted: '#475569',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
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

