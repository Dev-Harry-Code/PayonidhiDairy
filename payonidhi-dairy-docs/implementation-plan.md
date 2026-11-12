# implementation-plan.md — Technical Plan (HOW)

> How we build `plan.md`, phase by phase. Each phase step = one prompt in `prompt.md` (same IDs, e.g. **P4.1**). Progress is tracked in `progress.md`. Tests are defined in `testing.md`.

---

## 1. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (latest stable, App Router) + React + TypeScript (strict)** | At the time of writing, Next.js 16. Use whatever `create-next-app@latest` installs and record the versions in `progress.md`. In Next 16 the middleware file is `proxy.ts` (it was `middleware.ts` in ≤15); use the convention of the installed version |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (copied components) + **lucide-react** | |
| Tables | **@tanstack/react-table** (admin only) | shadcn data-table pattern |
| Charts | **Recharts** via shadcn `chart` (admin dashboard only) | |
| Database | **MongoDB Atlas** + **Mongoose** | Free M0 for dev/staging; see §7 for prod |
| Validation | **Zod** | Shared schemas for forms + server actions |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` | Admin forms; hawker screens use simple buttons |
| Auth | Custom, following the official Next.js auth guide: **jose** (JWT in an httpOnly cookie) + **bcryptjs** (PIN hash) + DAL checks | No third-party auth service needed for phone + PIN |
| Dates | **date-fns** + **@date-fns/tz** (`TZDate`) | All business dates in `Asia/Kolkata` |
| i18n | **next-intl** (without i18n routing; locale from cookie / user) | `messages/en.json`, `messages/hi.json` |
| Toasts | **sonner** (shadcn) | |
| Drag & drop | **@dnd-kit** (route order, desktop) | Up/down buttons on mobile |
| Tests | **Vitest** (unit + service) + **mongodb-memory-server** + **Playwright** (e2e) | |
| Lint/format | ESLint (Next config) + Prettier + `prettier-plugin-tailwindcss` | |
| Scripts | **tsx** to run `scripts/*.ts` | seed, create-admin |
| Code hosting | **GitHub** (your existing repo) | Every push → Vercel builds automatically |
| App hosting | **Vercel Hobby (free)** + **MongoDB Atlas M0 (free)**, region Mumbai `ap-south-1` | Next.js is made by Vercel, so zero config. See §7 for limits |

## 2. Architecture

```
Browser (phone / desktop)
   │  HTML (RSC) + small client islands
   ▼
Next.js App Router (Vercel, Node runtime)
   ├─ proxy.ts / middleware.ts → optimistic check: cookie present? redirect /login. (NOT the real security)
   ├─ app/**/page.tsx (Server Components) → features/*/queries.ts
   ├─ Client Components (cards, sheets, forms) → features/*/actions.ts (Server Actions)
   │                         │
   │        lib/dal.ts  ← requireRole / ownership / edit-window checks (REAL security)
   │                         │
   │        features/*/service.ts  (business logic, DB calls)  ← features/deliveries/expected.ts (pure logic)
   │                         │
   │        models/*.ts (Mongoose) ── lib/db.ts (cached connection)
   ▼
MongoDB Atlas
```

Rules:
- **Pages never touch Mongoose directly**: page → query → service → model.
- **Business logic is pure and tested** (`expected.ts`, `totals.ts`, `units.ts`, `dates.ts`).
- **Every action validates (Zod) and authorises (DAL)**, whatever the UI does.
- DTOs: queries return plain objects (ids as strings, no `pinHash`, no Mongoose docs) → safe to pass to Client Components.

## 3. Folder structure

```
payonidhi-dairy/
├─ docs/                         ← all .md docs from this kit
├─ messages/
│  ├─ en.json
│  └─ hi.json
├─ public/                       ← icons, manifest assets
├─ scripts/
│  ├─ create-admin.ts            ← npm run create-admin -- --name "Owner" --phone 98xxxxxxxx --pin 123456
│  └─ seed.ts                    ← npm run seed (dev only: 2 hawkers, 30 customers, 45 days of entries)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              ← fonts, NextIntlClientProvider, Toaster, <html lang>
│  │  ├─ globals.css             ← Tailwind + theme tokens (design.md §2)
│  │  ├─ page.tsx                ← redirect by role
│  │  ├─ login/page.tsx
│  │  ├─ hawker/
│  │  │  ├─ layout.tsx           ← requireRole(['hawker']) + HawkerShell
│  │  │  ├─ today/page.tsx
│  │  │  ├─ customers/page.tsx
│  │  │  ├─ customers/[id]/page.tsx
│  │  │  ├─ summary/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ admin/
│  │  │  ├─ layout.tsx           ← requireRole(['admin']) + AdminShell
│  │  │  ├─ page.tsx             ← dashboard
│  │  │  ├─ today/page.tsx
│  │  │  ├─ customers/(page|new|[id]|[id]/edit|[id]/print)
│  │  │  ├─ hawkers/(page|[id])
│  │  │  ├─ calendar/page.tsx, calendar/[dateKey]/page.tsx
│  │  │  ├─ reports/page.tsx
│  │  │  ├─ activity/page.tsx
│  │  │  └─ settings/page.tsx
│  │  └─ api/
│  │     ├─ health/route.ts
│  │     └─ reports/monthly/route.ts
│  ├─ components/
│  │  ├─ ui/                     ← shadcn (generated)
│  │  ├─ layout/ shared/ deliveries/ calendar/ admin/
│  ├─ features/
│  │  ├─ auth/        (actions.ts, schemas.ts)
│  │  ├─ users/       (queries.ts, actions.ts, service.ts, schemas.ts, components/)
│  │  ├─ customers/   (…same…)
│  │  ├─ deliveries/  (expected.ts, totals.ts, queries.ts, actions.ts, service.ts, schemas.ts, components/)
│  │  ├─ pauses/ substitutions/ (coverage.ts = pure access logic) settings/ reports/ audit/
│  ├─ i18n/request.ts            ← next-intl config (locale from cookie)
│  ├─ lib/
│  │  ├─ db.ts                   ← cached mongoose connection
│  │  ├─ session.ts              ← encrypt/decrypt/create/delete session cookie (jose)
│  │  ├─ dal.ts                  ← getSession, requireUser, requireRole, assert* (server-only)
│  │  ├─ constants.ts            ← enums (data-model.md §0)
│  │  ├─ dates.ts                ← todayKey(), toDateKey(), monthDays(), addDaysKey(), currentShift()
│  │  ├─ units.ts                ← mlToLitres, formatLitres, formatRupees, amountPaise
│  │  ├─ phone.ts                ← normalisePhone, isValidPhone
│  │  ├─ result.ts               ← ActionResult helpers
│  │  ├─ audit.ts                ← writeAudit()
│  │  ├─ logger.ts
│  │  └─ status-styles.ts
│  ├─ models/                    ← User, Customer, DeliveryEntry, CustomerPause, Substitution, Settings, AuditLog, index.ts
│  └─ proxy.ts (or middleware.ts)
├─ tests/
│  ├─ unit/                      ← dates, units, phone, expected, totals
│  ├─ integration/               ← services with mongodb-memory-server
│  └─ e2e/                       ← Playwright
├─ .env.example
├─ vitest.config.ts, playwright.config.ts
└─ README.md
```

### Environment variables (`.env.example`)
```
MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/payonidhi-dairy?retryWrites=true&w=majority
SESSION_SECRET=            # openssl rand -base64 32
APP_URL=http://localhost:3000
```

### npm scripts
`dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `format`, `test` (vitest run), `test:watch`, `test:e2e` (playwright), `seed`, `create-admin`.

---

## 4. Phases

> **One-week MVP track (active):** Execute only the condensed steps below for the first release. The detailed Phase 2–7 tables that follow are the post-MVP roadmap and must not be started during the one-week delivery window.

### Condensed MVP steps

| Step | Scope | Exit result |
|---|---|---|
| **MVP.1** | Finish P0.2 libraries/tests and P1.1/P1.2 models, connection, health, seed, and audit | Seeded database and green foundation checks |
| **MVP.2** | Implement minimal phone/PIN auth, role checks, login/logout, admin and hawker shells | Admin and hawker reach the correct workspace |
| **MVP.3** | Implement basic hawker/customer records and minimal admin management | Seeded or manually created customers are assigned to hawkers |
| **MVP.4** | Implement delivery engine, Today screen, quantities, reasons, idempotency, and audit | Hawker can mark a full day on a phone-sized screen |
| **MVP.5** | Implement customer month calendar and monthly totals/reference amount | Admin can reconcile marked deliveries and totals |
| **MVP.6** | Deploy, smoke-test, fix blocking issues, and hand off | MVP completion rule in `scope.md` is satisfied |

The following original phases are retained as the post-MVP roadmap: substitutions, pauses, advanced calendars/corrections, CSV/print/activity UI, full hardening, PWA, and pilot operations.

Each phase ends with a **gate**: all its checks in `testing.md` pass, `npm run lint && npm run typecheck && npm test && npm run build` are green, `progress.md` is updated, and a git commit is made.

### Phase 0: Project setup & foundations
| Step | Tasks | Output |
|---|---|---|
| **P0.1** Scaffold & tooling | create-next-app (TS, Tailwind, ESLint, App Router, `src/`, alias `@/*`), Prettier, shadcn init + base components, Vitest config, `.env.example`, npm scripts, `docs/` folder, `README.md` skeleton, git init | App runs at `localhost:3000` with a placeholder page using shadcn Button |
| **P0.2** Core libs + tests | `lib/constants.ts`, `dates.ts`, `units.ts`, `phone.ts`, `result.ts`, `logger.ts`, `status-styles.ts`; theme tokens + fonts in `globals.css`/`layout.tsx`; unit tests for dates/units/phone | `npm test` green (IST edge cases covered) |

### Phase 1: Database & data layer
| Step | Tasks | Output |
|---|---|---|
| **P1.1** Connection + models | `lib/db.ts` (global cached connection), 7 Mongoose models exactly as in `data-model.md` with indexes and validators, `models/index.ts`, `GET /api/health` | `/api/health` → `{ ok: true, db: "up" }` against Atlas |
| **P1.2** Scripts + audit | `lib/audit.ts`, `scripts/create-admin.ts`, `scripts/seed.ts` (refuses to run when `NODE_ENV=production`), `features/settings/service.ts#getSettings` | `npm run create-admin` and `npm run seed` work; data visible in Atlas |

### Phase 2: Auth, shells & i18n
| Step | Tasks | Output |
|---|---|---|
| **P2.1** Auth | `lib/session.ts`, `lib/dal.ts`, `features/auth/*` (login with lockout, logout, change PIN, set language), `/login` page, `proxy.ts` redirect, `/` role redirect, unit/integration tests for lockout + sessionVersion | Admin → `/admin`, hawker → `/hawker/today`, wrong role → redirected |
| **P2.2** Shells + i18n | next-intl setup (cookie `NEXT_LOCALE`, default from user), `messages/en.json` + `hi.json` (all keys used so far), `AdminShell`, `HawkerShell`, `LanguageToggle`, placeholder pages for every route with `PageHeader`, `loading.tsx`/`error.tsx`, `/hawker/settings` (PIN + language + logout) | Navigation works on mobile and desktop in both languages |

### Phase 3: Admin management
| Step | Tasks | Output |
|---|---|---|
| **P3.1** Hawkers + settings | users service/actions/queries, `/admin/hawkers` list + create/edit dialogs, reset PIN, (de)activate rule, `/admin/settings` (business, edit window, max hawker pause days, show ₹, evening time, own PIN) | Admin manages hawkers; a deactivated hawker is logged out |
| **P3.2** Customers | customers service/actions/queries, `DataTable`, `/admin/customers` (search/filter/paginate), form new/edit with `QtyStepper`, deactivate/reactivate, reassign, customer detail page skeleton (header + tabs) | Admin manages customers; hawker can view his list at `/hawker/customers` |
| **P3.3** Route order, pauses, substitutes, rate | `/admin/hawkers/[id]` route order (up/down + dnd-kit), admin pauses (tab on customer detail), **substitutes** (`substitutions` module + `coverage.ts` + "Leave & cover" section on the hawker page + list on `/admin/hawkers`), `changeRateAction` with preview count | All setup data exists for delivery marking |

### Phase 4: Daily delivery marking (core)
| Step | Tasks | Output |
|---|---|---|
| **P4.1** Delivery engine | `deliveries/expected.ts` (resolveCell etc.), `totals.ts`, `service.ts` (upsert idempotent, unmark, bulk), `assertDateEditable`, `assertHawkerOwnsCustomer` (own + covered), `assertCanActForHawker`, actions + `getTodaySheet` (own + covering sections), `createHawkerPauseAction` / `cancelPauseAction` rules, audit on every change; full unit + integration tests (`testing.md` §3) | All delivery rules proven by tests |
| **P4.2** Today screen | `/hawker/today` + `/admin/today`: `DateNav`, shift toggle, progress, `DeliveryCard`, `QtyStepper`, `NotDeliveredSheet`, `EntryEditSheet`, `BulkMarkButton`, optimistic updates + undo toast, offline banner, paused section, **"Covering for X" sections**, **card ⋯ menu → short pause sheet** | A hawker marks a full shift on a phone |

### Phase 5: Calendars & corrections
| Step | Tasks | Output |
|---|---|---|
| **P5.1** Customer calendar | `MonthGrid`, `DayCell`, `CustomerMonthCalendar`, `DayDetailSheet` (view + edit within rules), `getCustomerMonth`, month totals; used on `/hawker/customers/[id]` and `/admin/customers/[id]` | Correct colours/states for every day & shift |
| **P5.2** Master calendar + day register | `getMasterMonth`, `/admin/calendar` (grid + mobile list), `getDayRegister`, `/admin/calendar/[dateKey]` table with filters, admin correction with required reason outside the window, customer Activity tab | Admin can trace every entry: who, when, edits |

### Phase 6: Dashboard, reports, activity
| Step | Tasks | Output |
|---|---|---|
| **P6.1** Dashboard | `getDashboard`, stat cards, hawker progress, not-marked-yesterday list, 30-day chart | Live overview |
| **P6.2** Reports + CSV + summary | `getMonthlyReport` (aggregation), `/admin/reports` tabs, CSV route (UTF-8 BOM), `buildCustomerSummaryText` + Copy button, print view, `/hawker/summary` | Month-end numbers match the hand-calculated fixture |
| **P6.3** Activity log | `listAuditLogs`, `/admin/activity` with filters and before/after diff | Every change traceable |

### Phase 7: Hardening & launch
| Step | Tasks | Output |
|---|---|---|
| **P7.1** Hardening + E2E | Playwright e2e (testing.md §5), security headers (`next.config` headers: CSP basic, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy), login rate-limit check, input length limits, accessibility pass, 360 px pass, Hindi pass, performance pass | All e2e green |
| **P7.2** PWA + deploy + docs | `app/manifest.ts` + icons (installable, no offline), Atlas prod cluster + IP access + DB user, Vercel project + env vars, preview & production deploys, backup plan (§7), final `README.md` (setup, scripts, deploy, restore, troubleshooting) | Live HTTPS app; first admin created in prod |

### Phase dependency
`P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7` (strictly in order; P6.3 may run before P6.2).

---

## 5. Key implementation notes

1. **Today in IST**: `todayKey()` = `format(new TZDate(Date.now(), 'Asia/Kolkata'), 'yyyy-MM-dd')`. Never use `new Date().toISOString().slice(0,10)` (that's UTC; wrong before 5:30 AM IST, exactly when hawkers start!).
2. **Default shift**: `currentShift()` = morning if IST time < `settings.eveningStartsAt`, else evening.
3. **Idempotent marking**: unique index + `findOneAndUpdate(..., { upsert: true })`; catch duplicate-key error `11000` (race) → retry once as an update.
4. **Bulk mark**: compute the unmarked list on the server (never trust a client list), then `bulkWrite` with `updateOne` + `upsert` + `$setOnInsert` only (never overwrite existing entries).
5. **Snapshots** on insert: `defaultQtyMl`, `ratePaise` (customer override ?? settings default), `hawkerId` (customer's current hawker).
6. **Revalidation**: after delivery actions, `revalidatePath('/hawker/today')`, `/admin`, and the customer page; the Today screen also uses optimistic state, so it feels instant.
7. **Mongoose in Next**: cache the connection on `globalThis`; models defined as `models.X || model('X', schema)`; mark data files `import 'server-only'`.
8. **Server Actions security**: every action re-checks the session (actions are public POST endpoints). Never accept `markedBy`/`actorId` from the client; derive it from the session. A hawker may *request* another hawker's section (`forHawkerId`) only through `assertCanActForHawker`; the entry's `hawkerId` snapshot is always read from the customer document, never from input.
9. **Pagination** for admin lists (25/page); hawker lists are unpaginated (≤ ~100 rows).
10. **CSV**: escape quotes, prefix with BOM `\uFEFF`, litres as decimals, ₹ as plain numbers (no symbol) for spreadsheet maths.
11. **Errors**: log with context (`action`, `userId`, no PINs/phones in logs); return translation keys.

## 6. Performance & scale targets
- 600 customers, 10 hawkers, ~800 entries/day → trivial for MongoDB with the listed indexes.
- `/hawker/today` server response < 300 ms (excluding network); one query per collection, no N+1.
- Monthly report: aggregation on `dateKey` range + `$group` by customer → < 1 s.

## 7. Git, GitHub, deployment & operations

### 7.1 Git & GitHub workflow (you push manually)
- **P0.1** connects the project to your existing GitHub repo: `git remote add origin https://github.com/<you>/<repo>.git` → `git push -u origin main`.
- Copy all docs into `docs/` in the repo, so the plan lives next to the code.
- After **every step**: `git add . && git commit -m "feat(P#.#): <title>" && git push`.
- Before launch, push straight to `main`. **After launch**: work on a `dev` branch; Vercel gives every push a **Preview URL**. Merge `dev` → `main` = production deploy.
- Never commit `.env.local` (it's in `.gitignore`); secrets live only in Vercel env vars.

### 7.2 Hosting: Vercel Hobby + Atlas M0 (both free)
| Item | Plan |
|---|---|
| Framework | **Yes, it's a Next.js app**: one project for frontend + backend (Server Actions / Route Handlers). Vercel builds it with zero config |
| Connect | Vercel → "Add New Project" → import the GitHub repo → set env vars → Deploy. From then on every push to `main` auto-deploys |
| Env vars | Vercel Project → Settings → Environment Variables: `MONGODB_URI`, `SESSION_SECRET`, `APP_URL`, set separately for **Production** and **Preview** (Preview can point to the dev DB) |
| Environments | **dev** = your laptop + Atlas `payonidhi-dairy-dev` · **preview** = Vercel preview URLs + dev DB · **production** = `main` + Atlas `payonidhi-dairy` DB |
| Atlas | Region Mumbai. DB user with readWrite on the app DB only. Network access `0.0.0.0/0` (Vercel has no fixed IPs on Hobby) → use a long random password, keep the URI secret |
| Vercel Hobby limits (fine for this app) | Serverless function timeout (keep every request short; no long batch jobs), limited bandwidth/invocations per month (far above ~10 users), cron jobs limited to daily (we don't need cron). **Terms**: Hobby is meant for personal/non-commercial use. OK for building and piloting; if Vercel flags it or the business grows, switch to Pro or a VPS without code changes |
| Region | Set the Vercel Function region to Mumbai (`bom1`) in project settings so DB round-trips stay short |
| Backups | Atlas M0 has **no automated backups** → free **GitHub Actions** workflow (weekly + manual) runs `mongodump` and stores an encrypted archive as a private workflow artifact (90-day retention) + a documented restore drill. Optional: also download the archive monthly to Google Drive |
| Monitoring | `/api/health` uptime ping (UptimeRobot free), Vercel logs |
| Rollback | Vercel → Deployments → "Promote" a previous deployment (instant). DB changes are additive only in v1 |
| Data import (optional) | A CSV import script for existing customers can be added in P7.2 if you have a spreadsheet |

## 8. Definition of Done (every step)
- [ ] Code matches `skill.md` rules and the relevant docs.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass.
- [ ] The step's checks in `testing.md` pass (including the manual phone check where listed).
- [ ] All user-visible text is in `en.json` and `hi.json`.
- [ ] `progress.md` updated (tasks ticked, decisions, known issues).
- [ ] Git commit: `feat(P4.2): today screen`.
