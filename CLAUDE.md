# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests (server + client)
npm run test:server  # Server-side action tests only (Node env, requires .env.test)
npm run test:client  # Component tests only (happy-dom env)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db seed   # Seed the database
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `BACKBOARD_API_KEY` — Backboard AI API key
- `BACKBOARD_ASSISTANT_ID` — Pre-configured Backboard assistant ID

Server tests use `.env.test` (separate file, not `.env.local`).

## Architecture

**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma 7 (pg adapter), Supabase Auth, PostgreSQL.

### Auth Split
- **Supabase** handles authentication only (sessions, OAuth). `src/lib/supabase/server.ts` for Server Components/Actions; `src/lib/supabase/client.ts` for client components.
- **Prisma** handles all application data. `src/lib/prisma.ts` exports a singleton `prisma` client using a `pg.Pool` adapter (required for Supabase's connection pooler).

### Server Actions Pattern
All mutations live in `src/app/actions/` as `'use server'` files. Each returns `{ success: true, data }` or `{ success: false, error: string }`. Ownership is verified by checking `userId` against the record before mutating.

### AI System
- `src/lib/backboard.ts` — wrapper around the Backboard API (an OpenAI-compatible assistant API backed by Claude). Manages threads per user (`User.backboardThreadId`).
- `src/lib/ai/tools.ts` — tool implementations the AI can call: `createTrip`, `getUserGear`, `addGearToTrip`, `getUserProfile`, `updateUserPreferences`, `getWeatherForecast`.
- `src/lib/ai/preferences.ts` — manages `User.preferences` JSON (confidence levels: `default` | `inferred` | `confirmed`; conflict logging).
- `src/lib/ai/open-meteo.ts` — free weather API integration (no key needed). Hourly mode for day hikes, daily for multi-day trips.
- `src/app/actions/ai-chat.ts` — server action that orchestrates the Backboard run loop (add message → poll → handle tool calls → return response).

### Dashboard Layout
`src/app/dashboard/layout.tsx` wraps all dashboard pages with:
- `Sidebar` (desktop, hidden on mobile)
- `BottomNav` (mobile only)
- `AppHeader` (top bar with search, notifications, profile)
- `AIChat` (floating expandable chat, always present)

### Data Model Highlights (Prisma)
- `User.preferences` (JSON) — AI-managed backpacking preferences with confidence scores
- `GearItem` → `Category` (self-referential hierarchy via `parentId`)
- `Trip` → `Participant[]` + `TripGear[]` (gear assigned to trips with carrier/shared flags)
- `Trip` has a 1:1 `Conversation` auto-created for trip group chat
- `Friendship` — directed graph with `PENDING | ACCEPTED | BLOCKED` status

### Testing Layout
- **Server tests** (`npm run test:server`): test files in `src/app/actions/__tests__/` and `src/lib/ai/__tests__/`. Node environment, `fileParallelism: false` (tests share DB state).
- **Client tests** (`npm run test:client`): test files in `src/components/**/__tests__/`. happy-dom environment, `@testing-library/react`.
- Setup files: `src/test/setup-server.ts` and `src/test/setup-client.ts`.

### Path Alias
`@/` maps to `src/` (configured in `tsconfig.json` and both Vitest configs).
