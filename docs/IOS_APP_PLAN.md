# GearPack iOS App — Implementation Plan

**Goal:** Ship a production-ready, App Store-approved iOS app with full feature parity to the
logged-in GearPack web experience — same features, same visual language, adapted only where iOS
requires it.

**Status:** Plan approved decisions locked (see below). No code written yet.

---

## 1. Locked Decisions

| Decision | Choice | Why |
|---|---|---|
| iOS stack | **React Native + Expo** | Closest to a visual carbon copy (still React + your design tokens), reuses TypeScript types/schemas, real native app (no App Review 4.2 "repackaged website" risk), one language for the team. |
| PackBot gating | **Hide upsell in v1** | `isPaid` users get PackBot; free users never see it — no upgrade messaging anywhere in the app. Avoids Apple In-App Purchase requirements (guideline 3.1.1) entirely. StoreKit comes later when subscriptions are actually sold. |
| v1 scope | **Full dashboard parity** | Everything behind login: gear closet, trips, packing lists, weather, messages, social, notifications, search, profile/settings, PackBot (paid users). Landing page + waitlist stay web-only. |
| Backend | **REST API inside this Next.js app** (`/api/v1/*`) | Server actions can't be called from a native app. Route handlers reuse the exact same logic via extracted service functions, so web and iOS can never drift. One codebase, one deploy. |

---

## 2. What Exists Today (inventory the app must replicate)

### Screens (13 route pages today; everything under `/dashboard` plus login is in iOS scope)
- `/dashboard` — home overview
- `/dashboard/gear` — gear closet (CRUD, categories, conditions)
- `/dashboard/trips` + `/dashboard/trips/[id]` — trips list, trip detail (stats, group gear,
  recommended gear, weather widget, participants, invites, trip chat)
- `/dashboard/messages` — DMs + trip group chats (send/edit/delete, reactions, read receipts,
  unread counts — all via **10s polling**, no realtime)
- `/dashboard/social` + `/dashboard/social/[userId]/closet` — friends, requests, user search,
  friend closet viewing
- `/dashboard/ai-chat` + floating `AIChat` — PackBot (paid), structured responses
  (`trail_options`, `gear_analysis`), quick actions, preference questions
- `/dashboard/profile`, `/dashboard/settings` — profile edit, account deletion
- Global search (`searchGlobal`), notification dropdown (10s polling)
- Web-only, **not** ported: `/` landing, `/waitlist`, GSAP/framer-motion marketing animations

### API surface: ~55 server actions across 13 files
`auth` (4), `gear` (4), `trips` (10), `tripGear` (5), `messages` (11), `social` (7),
`notifications` (5), `search` (1), `categories` (1), `weather` (1), `user` (1), `waitlist` (2),
`ai-chat` (send/history/polling). Every one of these needs an HTTP equivalent
(except waitlist — web-only).

### Data & integrations
- **Prisma/PostgreSQL**: 13 models (User, Trip, Participant, TripGear, GearItem, Category,
  Friendship, Conversation, ConversationParticipant, Message, Reaction, Notification, Waitlist)
  — untouched by this project.
- **Supabase Auth**: email/password + Google OAuth. Sessions are **cookie-based** today.
- **Supabase Storage**: image uploads go client → Storage directly
  (`ImageUpload.tsx`), URL is then saved via server action. Google avatars are cached to
  Storage in `auth/callback`.
- **Backboard AI**: server-side only (`BACKBOARD_API_KEY`), thread per user, run loop with
  tool calls, can take tens of seconds per response.
- **Open-Meteo**: free weather API, called server-side, no key.

---

## 3. Target Architecture

```
┌─────────────────────┐         ┌──────────────────────────────────┐
│  iOS app (Expo/RN)  │         │  Next.js (this repo, one deploy) │
│                     │  HTTPS  │                                  │
│  Expo Router        ├────────►│  /api/v1/* route handlers        │
│  TanStack Query     │  Bearer │        │                         │
│  supabase-js        │  JWT    │        ▼                         │
│   (auth + storage)  │         │  src/lib/services/* ◄── server   │
│  SecureStore        │         │   (shared logic)      actions    │
└──────────┬──────────┘         │        │              (web)      │
           │                    │        ▼                         │
           │ auth + storage     │  Prisma ─► PostgreSQL            │
           ▼                    │  Backboard AI · Open-Meteo       │
      Supabase (Auth, Storage)  └──────────────────────────────────┘
```

- The native app authenticates **directly with Supabase** (email/password, native Google,
  native Apple) and holds the session in SecureStore.
- Every API call sends `Authorization: Bearer <supabase access token>`; route handlers verify
  it with `supabase.auth.getUser(token)` and then run the same service functions the web's
  server actions use.
- Image uploads keep the existing pattern: app → Supabase Storage → save URL via API.

---

## 4. Phase 0 — Prerequisites (week 0, mostly account/config work)

1. **Apple Developer Program** enrollment ($99/yr) — start immediately, verification can take days.
2. **App identity**: bundle ID (e.g. `com.gearpack.app`), App Store Connect app record.
3. **Sign in with Apple is mandatory** (guideline 4.8 — the app offers Google login, so Apple
   login must be offered too):
   - Enable Apple as a provider in Supabase Auth dashboard.
   - Create the Service ID / key in the Apple Developer portal.
4. **Google OAuth for native**: create an iOS OAuth client ID in Google Cloud Console (the
   existing web client ID keeps working for web).
5. **EAS (Expo Application Services)** account — cloud builds mean no Mac is strictly required
   for building; a Mac (or a borrowed one) is still useful for Simulator testing.
6. **Privacy policy + terms of service URLs** — required fields in App Store Connect. Terms
   must state that objectionable content/abusive users aren't tolerated (UGC guideline 1.2).
7. `SUPABASE_SERVICE_ROLE_KEY` added to server env (needed for complete account deletion —
   see Phase 1.5). Server-side only, never shipped in the app.

---

## 5. Phase 1 — Backend API layer (~2–3 weeks; unblocks everything)

This is the enabling work and happens **in this repo**. The web app keeps working unchanged
throughout.

### 5.1 Extract services from server actions
- New directory `src/lib/services/` — one module per domain (`trips.ts`, `gear.ts`,
  `messages.ts`, `social.ts`, `notifications.ts`, `search.ts`, `tripGear.ts`, `users.ts`,
  `aiChat.ts`).
- Each service function takes `(userId, input)` as plain objects and returns
  `{ success, data | error }` — **pure logic + Prisma, no Next.js imports**.
- Server actions become thin wrappers: resolve user from cookies → call service →
  `revalidatePath(...)` / `redirect(...)`. **`revalidatePath` stays in the action wrapper**,
  never in the service (it throws outside a request context and means nothing to iOS).
- `signIn`/`signUp` currently take `FormData` — services take typed objects; the actions
  adapt.
- Guardrail: the existing server test suite (`npm run test:server`) covers the actions;
  it must stay green after every extraction. Refactor one domain at a time.

### 5.2 Bearer-token auth for route handlers
- New helper `src/lib/supabase/api.ts`: reads `Authorization: Bearer <jwt>`, validates via
  `supabase.auth.getUser(jwt)`, returns the user or a 401. All `/api/v1` handlers use it.
- Exclude `/api/v1` from `middleware.ts`'s matcher (its cookie/redirect logic is web-only).

### 5.3 Endpoint map (mirrors the action surface 1:1)

| Domain | Endpoints |
|---|---|
| Auth/session | `POST /api/v1/auth/sync` (see 5.4) · `DELETE /api/v1/account` |
| Me | `GET/PATCH /api/v1/me` (profile, settings, preferences) |
| Gear | `GET/POST /api/v1/gear` · `PATCH/DELETE /api/v1/gear/:id` |
| Categories | `GET /api/v1/categories` |
| Trips | `GET/POST /api/v1/trips` · `GET/DELETE /api/v1/trips/:id` · `PATCH /api/v1/trips/:id/image` · `GET /api/v1/trips/friends` · `GET /api/v1/trips/invites` · `POST /api/v1/trips/:id/invite` · `POST /api/v1/trips/invites/:id/respond` |
| Trip gear | `GET/POST /api/v1/trips/:id/gear` · `POST /api/v1/trips/:id/gear/bulk` · `PATCH /api/v1/trip-gear/:id/packed` · `DELETE /api/v1/trip-gear/:id` |
| Weather | `GET /api/v1/trips/:id/weather` |
| Messages | `GET/POST /api/v1/conversations` · `GET /api/v1/conversations/:id/messages` · `POST /api/v1/conversations/:id/messages` · `PATCH/DELETE /api/v1/messages/:id` · `POST /api/v1/messages/:id/reactions` · `POST /api/v1/conversations/:id/read` · `POST /api/v1/conversations/:id/archive` · `GET /api/v1/messages/unread-count` · `GET /api/v1/trips/:id/conversation` |
| Social | `GET /api/v1/users/search` · `GET /api/v1/friends` · `GET /api/v1/friends/requests` · `GET /api/v1/friends/requests/sent` · `POST /api/v1/friends/requests` · `POST /api/v1/friends/requests/:id/respond` · `DELETE /api/v1/friends/requests/:id` · `GET /api/v1/users/:id/gear` (friend closet) |
| Notifications | `GET /api/v1/notifications` · `GET /api/v1/notifications/unread-count` · `POST /api/v1/notifications/:id/read` · `POST /api/v1/notifications/read-all` |
| Search | `GET /api/v1/search?q=` |
| AI | `POST /api/v1/ai/chat` · `GET /api/v1/ai/history` |
| Moderation (new) | `POST /api/v1/reports` · `POST /api/v1/users/:id/block` (see 5.6) |

Conventions: JSON bodies validated with **zod** (already a dependency); responses keep the
existing `{ success, data | error }` contract; cursor pagination on messages/notifications
lists; consistent 401/403/404 status codes.

### 5.4 `POST /api/v1/auth/sync` — critical gap found in review
Native sign-in **bypasses `/auth/callback`**, which is where Prisma user rows are created for
OAuth users today (`auth/callback/route.ts:140-171`: find-or-create user, generate unique
username, cache Google avatar to Storage). Without an equivalent, a first-time
Google/Apple sign-in from the iPhone authenticates fine but has **no User row**, and every
subsequent query breaks.
- Extract that callback logic into `src/lib/services/users.ts` → `syncAuthUser(...)`.
- The callback route and the new endpoint both call it. The app calls `auth/sync` once after
  every successful native sign-in (idempotent).
- Apple sign-in often provides no name and a private-relay email — `syncAuthUser` must
  tolerate missing metadata (fall back to email-prefix usernames, no avatar).

### 5.5 Complete account deletion — App Review blocker found in review
`deleteAccount` (`src/app/actions/user.ts`) deletes the Prisma row and signs out, but **never
deletes the Supabase auth user** — the account still exists and can log back in. Apple
guideline 5.1.1(v) requires real in-app account deletion.
- Fix in the shared service: delete Prisma row, then
  `supabaseAdmin.auth.admin.deleteUser(userId)` using the service-role key.
- This fixes the web app too. Expose as `DELETE /api/v1/account` and surface it in the iOS
  Settings screen.

### 5.6 UGC moderation minimums — App Review blocker found in review
The app has user-generated content (messages, profiles, trip descriptions, gear photos).
Guideline 1.2 requires: a way to **report** objectionable content, a way to **block** abusive
users, filtering, and published contact info.
- Blocking half-exists (`Friendship` status `BLOCKED`) — expose it in the API and in the iOS
  UI (long-press a user/message → Block).
- Add a minimal `Report` model (reporterId, targetType, targetId, reason, createdAt) +
  `POST /api/v1/reports` + a "Report" action in message/profile context menus. v1 handling
  can be manual (admin reviews reports in the DB), but the mechanism must exist.
- Terms of service must state zero tolerance for objectionable content.

### 5.7 AI endpoint specifics
- `POST /api/v1/ai/chat` wraps the existing `sendAIMessage` service. Backboard runs poll
  server-side and can take 30–90s: the deploy already runs in Docker (no serverless timeout),
  but set an explicit route timeout and make the iOS client show a streaming-style "thinking"
  state with a 120s client timeout.
- For **free users the endpoint returns 403 with a neutral error** — not the current
  "Upgrade your plan…" string. The app never renders PackBot UI for free users
  (`GET /api/v1/me` returns `isPaid`), so no upsell language can leak (guideline 3.1.1).
- Web keeps its current copy; the message moves into the web action wrapper.

### 5.8 Hardening (new public surface)
- Rate limiting on `/api/v1/*` (in-memory or Upstash; strictest on `ai/chat`, `auth/sync`,
  `users/search`).
- Never echo internal errors; log server-side, return generic messages.
- CORS: not needed for the native app (no browser origin), keep it locked down.

**Exit criteria:** every endpoint has an integration test hitting the route handler with a real
JWT (extend the existing Vitest server project); `npm run test:server` green; web app
regression-tested.

---

## 6. Phase 2 — Expo app foundation (~1–2 weeks, parallelizable with Phase 1 tail)

New repo (or `ios/` workspace — recommend a **separate repo** to keep Next.js tooling clean;
share types by copying `src/types` + zod schemas into a small shared package or via codegen).

### Stack
| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo (latest stable SDK), TypeScript strict | EAS Build for CI builds, TestFlight distribution |
| Navigation | Expo Router | File-based, mirrors the Next.js App Router mental model |
| Styling | **NativeWind v4** (Tailwind for RN) | Port `globals.css` tokens; the web's Tailwind classes translate nearly 1:1 — this is what makes "carbon copy" cheap |
| Fonts | `expo-font` with Outfit + Inter | Same families as web (`@fontsource` → bundled TTFs) |
| Dark mode | `useColorScheme` + NativeWind `dark:` | Replaces `next-themes`; follow system, plus manual toggle in Settings like web |
| Server state | TanStack Query | Caching, polling intervals (10s badges — parity with web), optimistic updates, pull-to-refresh |
| Auth/storage | `@supabase/supabase-js` + `expo-secure-store` | Session persisted in Keychain; `autoRefreshToken` wired to `AppState` (documented Supabase+Expo pattern) |
| Forms | `react-hook-form` + zod | Same libraries as web — forms port almost verbatim |
| Animations | `react-native-reanimated` (+ Moti) | Replaces framer-motion/GSAP where the dashboard uses them |
| Markdown (PackBot) | `react-native-markdown-display` | Replaces `react-markdown` |
| Toasts | `sonner-native` or `react-native-toast-message` | Replaces sonner |
| Icons | `lucide-react-native` | Same icon set as web (`lucide-react`) — pixel parity |

### Auth flows to build
1. Email/password sign-in + sign-up (username availability check via API before submit —
   mirrors web's `signUp` username/email pre-checks).
2. **Google**: native flow → `supabase.auth.signInWithIdToken({ provider: 'google', token })`.
3. **Apple**: `expo-apple-authentication` → `signInWithIdToken({ provider: 'apple', token })`.
4. After any successful auth: `POST /api/v1/auth/sync`, then enter the app.
5. Password reset: triggers the existing Supabase email (web-hosted reset page is acceptable
   for v1).
6. Session handling: on 401 from any API call → refresh token → retry once → sign out.

**Exit criteria:** sign in/up/out with all three methods on a physical device; authenticated
`GET /api/v1/me` renders profile data.

---

## 7. Phase 3 — Feature build (~4–6 weeks)

Tab bar mirrors the web's mobile `BottomNav` exactly: **Home · Trips · AI (center) · Closet ·
Social**, with Messages, Notifications, Search, and Profile reachable from the header, same as
`AppHeader`.

Build order (each slice = screens + API wiring + tests, shippable to TestFlight incrementally):

| # | Slice | Screens / components ported | Key parity notes |
|---|---|---|---|
| 1 | Shell + Home | Tab bar, header, dashboard overview | Badges poll every 10s like web (`UnreadMessageBadge`, `NotificationDropdown`) |
| 2 | Gear closet | `GearClosetView`, `GearGrid`, `GearCard`, `GearForm` | Categories hierarchy, conditions; image upload via `expo-image-picker` → Supabase Storage (same bucket/path scheme as `ImageUpload.tsx`) |
| 3 | Trips | `TripDashboardView`, `TripCard`, `CreateTripModal`, trip detail (stats/participants/about), `InviteFriendModal`, invites accept/decline | Popular trails data (`src/data/popularTrails.ts`) ships in-app |
| 4 | Packing lists + weather | `TripGearList`, `AddTripGearModal`, `RecommendedGear`, `WeatherWidget` | Toggle-packed uses optimistic updates; weather via `GET /trips/:id/weather` |
| 5 | Social | `FriendList`, `FriendRequests`, `SentRequests`, `UserSearch`, friend closet | Plus **Block/Report** UI (new, guideline 1.2) |
| 6 | Messages | `ChatInterface`, `MessageBubble`, conversations list, trip chat entry (`TripChatButton`) | Polling parity (web polls in `ChatInterface`); reactions, edit/delete, read receipts |
| 7 | Notifications + global search | Notification list, `SearchDialog` equivalent | Deep-link taps to trips/friends/messages |
| 8 | Profile + Settings | Profile edit, avatar upload, theme toggle, **Delete Account**, sign out, licenses/legal | Account deletion confirmation flow required by Apple |
| 9 | PackBot | `AIChat` (full-screen chat, not floating bubble — iOS pattern), `TrailCard`, `GearAnalysis`, `QuickActions` | Only rendered when `me.isPaid`; free users see no trace of it. Structured JSON cards + preference single-choice questions ported 1:1 |

"Carbon copy" definition (to prevent scope disputes): **feature-for-feature and
visual-language parity** (colors, typography, spacing, iconography, card designs) — not
pixel-cloning desktop layouts. The web app's own mobile breakpoint is the reference design;
navigation uses native transitions and gestures per Apple HIG.

---

## 8. Phase 4 — iOS adaptations (~1 week, mostly inside Phase 3 slices)

- **Safe areas, keyboard avoidance** (chat + forms), haptics on key actions.
- **Pull-to-refresh** on all lists (replaces web's router.refresh patterns).
- **Offline/poor network**: TanStack Query cached data + a global "offline" banner; graceful
  retries. (True offline-first sync is out of scope for v1.)
- **Images**: `expo-image` with caching for avatars/trip/gear images.
- **Deep links / universal links**: `gearpack://` scheme for v1 (notification taps);
  universal links can come with push notifications in v1.1.
- **Push notifications: deliberately v1.1**, not v1. Web parity is polling-based in-app
  notifications, which v1 replicates. This keeps APNs entitlements, device-token storage, and
  a send-pipeline out of the critical path. (Requires a `DeviceToken` table + Expo Push API
  server-side when we do it.)

---

## 9. Phase 5 — Testing & beta (~2 weeks, overlaps Phase 3 tail)

- **Unit/component**: Vitest-equivalent via Jest + React Native Testing Library (mirror the
  web's `__tests__` conventions).
- **API integration tests**: live in this repo (Phase 1 exit criteria).
- **E2E**: Maestro flows for the critical paths — sign up, create gear, create trip, pack
  gear, send message, accept friend request, delete account.
- **Device matrix**: smallest supported iPhone (SE), largest (Pro Max), light/dark, iOS N and
  N-1.
- **TestFlight**: internal testing from slice 3 onward; external beta (friends/waitlist
  users) for 2+ weeks before submission. Crash reporting via Sentry (`sentry-expo`).

---

## 10. Phase 6 — App Store submission (~1 week + review time)

### Compliance checklist (each item maps to a rejection class)
- [ ] **4.8** Sign in with Apple present (because Google login is offered).
- [ ] **5.1.1(v)** In-app account deletion, truly deletes auth user (Phase 1.5).
- [ ] **1.2 UGC** Report content + block users + ToS + contact method (Phase 1.6, slice 5).
- [ ] **3.1.1** Zero purchase/upgrade language anywhere (PackBot invisible to free users;
      audit all strings for "upgrade", "plan", "paid").
- [ ] **2.1** App completeness: no placeholder screens; every feature works on reviewer's
      device; **demo account credentials** provided in App Review notes — seeded with gear,
      trips, friends, messages, and `isPaid = true` so PackBot is reviewable.
- [ ] **5.1.1/5.1.2 Privacy**: privacy policy URL; App Privacy "nutrition labels" — declares
      collection of email, name, username, user content (photos, messages), and coarse
      location string (user-entered, not GPS — the app requests **no location permission**
      in v1; weather uses trip coordinates from geocoded trail data).
- [ ] **Privacy manifests**: rely on Expo SDK's bundled `PrivacyInfo.xcprivacy`; verify
      third-party SDKs (Sentry, Supabase) declare required-reason APIs at build time.
- [ ] **Permissions strings**: `NSPhotoLibraryUsageDescription` (+ camera if enabled) with
      specific, honest copy.
- [ ] **Age rating questionnaire**: user-generated content + unfiltered web-ish AI output →
      expect 12+; answer Apple's AI-generated-content questions honestly (PackBot is
      constrained to gear/trip topics with an out-of-scope filter — `scope.ts`).
- [ ] **Export compliance**: standard HTTPS only → exempt encryption declaration.
- [ ] Store assets: name, subtitle, keywords, screenshots (6.7" + 6.1"), app icon (already
      have `icon.svg` as the base), description.

### Review notes to include
Demo account credentials; explanation that PackBot is an assistant limited to hiking/gear
topics; where Report/Block live; confirmation that no purchases exist in the app.

---

## 11. Timeline & effort (1 experienced RN/TS dev, full-time)

| Phase | Duration | Calendar overlap |
|---|---|---|
| 0 Prereqs | days | week 1 (admin, parallel) |
| 1 Backend API | 2–3 wks | weeks 1–3 |
| 2 App foundation | 1–2 wks | weeks 2–4 |
| 3 Features | 4–6 wks | weeks 4–9 |
| 4 iOS adaptations | ~1 wk | inside Phase 3 |
| 5 Testing/beta | 2 wks | weeks 9–11 (beta runs in background) |
| 6 Submission | 1 wk + review | weeks 11–12 |

**Realistic total: ~3 months to App Store.** Two devs (one backend, one RN) compress to
~7–8 weeks. First App Review round-trip: 1–3 days typically; budget one rejection cycle.

---

## 12. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Service extraction regresses the web app | Medium | Existing server tests must stay green per-domain; actions keep identical signatures; refactor one domain per PR |
| First-time native OAuth user has no DB row | **Certain without fix** | `auth/sync` endpoint (5.4) — non-negotiable, built before any app screen |
| Apple rejects for account deletion | High without fix | Phase 1.5 admin-delete fix |
| Apple rejects for UGC (no report/block) | High without fix | Phase 1.6 moderation minimums |
| Apple rejects for upsell language | Medium | 403-neutral API + string audit; PackBot fully hidden for free users |
| Backboard latency (30–90s) feels broken on mobile | Medium | Persistent "thinking" UI, 120s timeout, request cancellation; consider async run-id polling in v1.1 if complaints |
| Sign in with Apple's private-relay emails break username/email logic | Medium | `syncAuthUser` handles missing name/relay emails; test explicitly |
| Public API abuse (new attack surface) | Medium | Rate limiting, zod validation everywhere, generic errors |
| Expo/RN dependency churn mid-project | Low | Pin SDK at kickoff; no upgrades until post-launch |
| Token expiry mid-session UX | Low | supabase-js auto-refresh + 401-retry interceptor |
| Reviewer sees an empty app | Medium | Seeded demo account (extend `prisma/seed.ts`) |

---

## 13. Plan self-review — objections raised and resolved

1. **"Why not Capacitor? It's the literal carbon copy."** Fastest path, but the highest
   rejection risk (4.2 minimum functionality) for an app that is a repackaged website with no
   native capabilities in v1 (push is deferred). RN gives a native app that *looks* like the
   website. Decision: RN, confirmed by owner.
2. **"Server actions can technically be invoked over HTTP — skip the API?"** The action
   endpoint protocol is private, unversioned, and changes between Next.js releases. Building
   on it would break silently. The REST layer is unavoidable and also fixes the web's
   architecture (services become testable in isolation).
3. **"Direct Supabase + RLS instead of an API?"** All authorization today is app-level Prisma
   checks; porting ~55 actions of ownership logic to SQL policies is a rewrite with a huge
   drift/security-hole risk, and AI/weather still need a server. Rejected.
4. **"Is polling embarrassing for a 2026 iOS app?"** It's exact web parity, battery cost at
   10s foreground-only is negligible, and TanStack Query makes intervals trivial.
   Realtime/push is a clean v1.1 upgrade behind the same API.
5. **"Separate repo will drift from web types."** True risk. Mitigation: shared types
   package (or straight codegen from zod schemas) as part of Phase 2; the
   `{ success, data | error }` contract is already uniform.
6. **"Hidden PackBot = reviewer can't see your flagship feature."** Solved via demo account
   with `isPaid = true` in review notes; Apple reviews what the account shows.
7. **"Is hiding a paid feature itself a review problem?"** No — offering different features
   to different account types is fine; what's prohibited is steering to external payment.
   Nothing in the app may reference upgrading. String audit is on the checklist.
8. **"What about iPad?"** Ship iPhone-only in v1 (uncheck iPad in the target) — a bad
   stretched iPad layout is a rejection/1-star magnet. iPad later.
9. **"Password reset opens the web — acceptable?"** Yes: account management via web is fine;
   it's *purchases* that can't be externalized. v1.1 can deep-link reset.
10. **"Weather/geocoding on device instead of API?"** Keep it server-side: web parity, one
    Open-Meteo integration, no client key management. `GET /trips/:id/weather` is cheap.

---

## 14. Immediate next steps

1. Start Apple Developer enrollment (longest external lead time).
2. PR 1 in this repo: services extraction for `users` + `auth/sync` + fixed account
   deletion + bearer-auth helper (the review-blocking backend work).
3. PR 2..n: remaining domain services + `/api/v1` routes + integration tests.
4. Scaffold the Expo app (Phase 2 stack) once `auth/sync` is deployed.
5. Configure Apple + Google native sign-in providers in Supabase.
