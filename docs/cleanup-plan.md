# Env Var Consolidation & Next.js Cleanup Plan

## 1. Rename `.env.local` vars to `VITE_*`

```diff
-NEXT_PUBLIC_SUPABASE_URL=...
-NEXT_PUBLIC_SUPABASE_ANON_KEY=...
-NEXT_PUBLIC_APP_URL=...
+VITE_SUPABASE_URL=...
+VITE_SUPABASE_ANON_KEY=...
+VITE_APP_URL=...
```

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `INSTAGRAM_APP_*`, etc.) stay unchanged.

## 2. Remove fallback chains in code (8 files)

Every `VITE_X || NEXT_PUBLIC_X` → just `VITE_X`.

| File | Lines |
|------|-------|
| `lib/supabase/client.ts` | L11-12 |
| `lib/storage.ts` | L37 |
| `lib/db/creator.ts` | L40, L45 |
| `lib/instagram/tokens.ts` | L40-41, L87-88, L117-118 |
| `lib/youtube/tokens.ts` | L37-38, L86-87 |
| `lib/webhooks/n8n.ts` | L8 |
| `lib/utils/app-url.ts` | L18-20 (+ remove Vercel refs) |
| `src/pages/SettingsConnectionsPage.tsx` | L120 |

## 3. Delete dead Next.js files

```bash
rm -rf middleware.ts next.config.js next-env.d.ts .next/ tsconfig.tsbuildinfo
```

## 4. Remove `'use client'` directives (14 files)

Harmless but misleading — strip from all `components/` files.

## 5. Verify

1. `npx tsc --noEmit` → 0 errors
2. `npx vite build` → succeeds
3. `npm run dev` → loads on localhost:8000
