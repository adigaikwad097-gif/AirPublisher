# Air Publisher: Next.js → Vite + React Migration

## Is the framework the problem?

**Yes.** Every auth bug you hit was caused by Next.js, not your code:

| Bug | Next.js Root Cause |
|-----|-----------|
| Cookie not reaching API routes | Middleware **drops Set-Cookie headers** from Route Handlers |
| 401 after successful login | App Router **caches pre-fetched "unauthorized" states** |
| Hydration mismatch errors | SSR HTML must **byte-for-byte match** the client |
| Supabase crashes | SSR adapter parses cookies server-side — corrupted ones **crash the process** |

In a Vite SPA, **none of these bugs can exist**:
- No SSR → no hydration mismatches
- No middleware → no cookie interception
- No route caching → no stale auth states
- Client-only Supabase → corrupted cookies fail gracefully

## What do other SaaS dashboards use?

**Industry consensus (2025-2026):** For auth-gated dashboards where SEO is irrelevant, **Vite + React SPA is the standard.** Next.js is overkill unless you need SSR for public marketing pages. Air Publisher is entirely behind a login wall — zero SEO benefit from Next.js.

---

## Current Inventory

### Pages (8 screens → copy with minor edits)

| Next.js Route | Vite Page |
|--------------|-----------|
| `app/page.tsx` | `pages/LoginPage.tsx` |
| `(dashboard)/dashboard/page.tsx` | `pages/DashboardPage.tsx` |
| `(dashboard)/videos/page.tsx` | `pages/VideosPage.tsx` |
| `(dashboard)/upload/page.tsx` | `pages/UploadPage.tsx` |
| `(dashboard)/schedule/page.tsx` | `pages/SchedulePage.tsx` |
| `(dashboard)/discover/page.tsx` | `pages/DiscoverPage.tsx` |
| `(dashboard)/leaderboard/page.tsx` | `pages/LeaderboardPage.tsx` |
| `(dashboard)/setup/page.tsx` | `pages/SetupPage.tsx` |

### Components (27 files → zero changes, just copy)

All 27 components are already pure React client components. They transfer with **zero code changes** — just update import paths.

### Lib Files (20 files)

| File | Action |
|------|--------|
| `lib/supabase/client.ts` | ✅ Keep — becomes the **only** Supabase client |
| `lib/supabase/server.ts` | ❌ Delete — no SSR |
| `lib/supabase/auth-helper.ts` | ❌ Delete |
| `lib/supabase/types.ts` | ✅ Keep |
| `lib/db/*` | 🔄 Refactor — direct Supabase client calls |
| `lib/utils/*`, `lib/platforms/*` | ✅ Keep |
| `lib/webhooks/*`, `lib/*/tokens.ts` | ↗ Move to Supabase Edge Functions |

### API Routes (60 files → mostly deletable)

| Category | Count | Action |
|----------|-------|--------|
| Debug routes (`api/debug/*`) | ~13 | ❌ Delete all |
| OAuth callbacks + n8n webhooks | ~21 | ↗ Supabase Edge Functions |
| Profile/Video CRUD | ~10 | 🔄 Direct Supabase client calls with RLS |

**`middleware.ts` is completely eliminated.** No middleware exists in a Vite SPA.

---

## New Architecture

```
AirPublisher/
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx              ← Router + auth guard (like AirCreator)
│   ├── index.tsx
│   ├── supabaseClient.ts   ← Single client (like AirCreator)
│   ├── pages/               ← 8 pages
│   ├── components/          ← 27 components (copied)
│   ├── lib/                 ← Utilities + DB helpers
│   └── hooks/
├── public/
└── supabase/functions/      ← Edge Functions (OAuth, n8n, tokens)
```

### Auth Flow (Dead Simple)

```
Air Ideas → sets creator_profile_id cookie → redirects to Air Publisher
Air Publisher (SPA) → App.tsx reads document.cookie → shows dashboard
Dashboard → calls Supabase directly (RLS protects data)
```

No middleware. No server. No SSR. No cookie interception. **Just React.**

---

## Migration Phases

### Phase 1: Scaffold + Auth (Day 1)
- [ ] Create Vite project alongside existing Next.js
- [ ] Set up `supabaseClient.ts` (AirCreator pattern)
- [ ] Build `App.tsx` with routing and auth guard
- [ ] Implement login page with cookie-based auth

### Phase 2: Dashboard Pages (Day 2-3)
- [ ] Copy 27 components (fix imports)
- [ ] Migrate 8 pages (remove `'use client'`, server imports)
- [ ] Refactor `lib/db/*` to client-side Supabase
- [ ] Set up routing (React Router or simple path routing)

### Phase 3: API → Edge Functions (Day 3-4)
- [ ] Move OAuth flows to Edge Functions
- [ ] Move n8n webhooks to Edge Functions
- [ ] Move token refresh to Edge Functions
- [ ] Delete debug routes

### Phase 4: Cleanup + Deploy (Day 4-5)
- [ ] Delete Next.js files (`middleware.ts`, `next.config.js`, `app/`)
- [ ] Update `ecosystem.config.js` for Vite
- [ ] Update `deploy.sh`
- [ ] Full end-to-end test

---

## Verification

1. Enter unique identifier → dashboard loads
2. KPIs, videos display correctly
3. Upload video flow works
4. OAuth connections work
5. n8n webhooks process correctly
6. Sign out clears session
