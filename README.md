# AIR Publisher

A production-grade Creator OS platform for publishing, scheduling, leaderboards, and analytics.

## Features

- **Content Publishing**: Upload and manage creator content (AI-generated or UGC)
- **Scheduling**: Schedule posts across multiple platforms
- **Leaderboards**: Track performance and compete with other creators
- **Analytics**: Monitor views, likes, comments, and revenue

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Auth**: Supabase Auth

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Run the migration files in the `supabase/migrations` directory to set up the required tables.

## Project Structure

```
app/
  ├── (auth)/          # Authentication pages
  ├── (dashboard)/     # Protected dashboard routes
  ├── api/             # API routes
  ├── layout.tsx       # Root layout
  └── page.tsx         # Landing page

components/
  ├── ui/              # Reusable UI components
  ├── dashboard/       # Dashboard-specific components
  └── leaderboard/     # Leaderboard components

lib/
  ├── supabase/        # Supabase client setup
  ├── db/              # Database utilities
  └── utils/           # Helper functions
```


