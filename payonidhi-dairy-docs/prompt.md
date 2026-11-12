# prompt.md — Copy-Paste Prompts, Phase by Phase

> **Active one-week plan:** Use only the condensed MVP track in `scope.md`: P0.2 → P1.1/P1.2 → P2.1/P2.2 → minimal P3 → P4.1/P4.2 → minimal P5/P6 → P7 deployment smoke test. The remaining prompts in this file are post-MVP and are intentionally deferred.

> One prompt per step. Run them **in order**. Each prompt lists what to **attach**, the **prompt text** to paste, the **expected output** from the AI, and what **you should see** afterwards.
> IDs match `implementation-plan.md` §4, `testing.md` §3 and `progress.md`.

---

## How to run a prompt (every time)

1. Open a **new chat** in ChatGPT / Gemini.
2. **Attach** the listed files. `skill.md` + `progress.md` are **always** attached.
3. For steps after P0.1, also attach a **code bundle** of the current project:
   ```bash
   npx repomix --include "src/**,scripts/**,tests/**,messages/**,package.json,tsconfig.json,next.config.*,vitest.config.ts" -o code-bundle.txt
   ```
4. Paste **Prompt 00** (session starter) first, then the step's prompt in the **same message** (or right after).
5. Copy each file the AI gives you into the project (exact path, full content). Run the commands it lists.
6. Do the **Verify** checks. If something fails → **Fix Error** prompt (bottom of this file).
7. Paste the AI's `progress.md` update into `docs/progress.md` → `git add . && git commit -m "feat(P#.#): …"`.

> 💡 If the AI's answer is cut off, send the **Continue** prompt. Never accept partial files ("…rest of code").

---

## Prompt 00: Session starter (paste at the top of EVERY new chat)

```text
You are the senior full-stack engineer on my project "Payonidhi Dairy", a milk-delivery register web app (one Next.js App Router project + TypeScript + Tailwind + shadcn/ui + MongoDB Atlas/Mongoose), used by one admin and several hawkers, in Hindi and English. Code is on GitHub and deploys to Vercel Hobby (free).

I have attached the project docs. Treat them as the source of truth in this priority order:
1) skill.md: your rulebook and REQUIRED output format. Follow it strictly.
2) plan.md: scope and business rules (NO billing / payments / invoices, ever).
3) data-model.md, api.md, design.md, implementation-plan.md, testing.md: exact names, shapes, screens, steps and checks.
4) progress.md: what is already done and decisions already locked.
5) code-bundle.txt (if attached): the current code. Stay consistent with it.

Rules for this chat:
- Do ONLY the step I give you below. Don't start the next step.
- Output COMPLETE files with full paths (no partial snippets, no "rest unchanged").
- If anything in the docs is unclear or conflicting, list your questions/assumptions FIRST, briefly, then proceed with the safest assumption unless it changes the scope.
- End with: Commands, Verify checklist, and a paste-ready progress.md update block.
- If you run out of space, stop at a file boundary and write "⏸ CONTINUE NEEDED" with the remaining file list.

The step to do now is:
```

---

# PHASE 0: Project setup & foundations

## P0.1 Scaffold & tooling
**Attach:** `skill.md`, `progress.md`, `implementation-plan.md`, `design.md`
```text
STEP P0.1: Scaffold & tooling.

Goal: a fresh Next.js project "payonidhi-dairy" that runs, with all tooling configured, following implementation-plan.md §1, §3 and the env/scripts sections.

Do:
1. Give the exact create-next-app command (TypeScript, Tailwind, ESLint, App Router, src/ dir, import alias @/*, no Turbopack questions left unanswered), then every install command for the stack in skill.md §3 (runtime deps and dev deps separately).
2. shadcn init + add these components: button, input, label, card, badge, sonner, skeleton, separator.
3. Prettier + prettier-plugin-tailwindcss config, .prettierignore, ESLint additions if needed.
4. Vitest config (node environment, path alias @, tests/ folder) + one sample test.
5. package.json scripts: dev, build, start, lint, typecheck, format, test, test:watch, test:e2e (placeholder), seed, create-admin (tsx).
6. .env.example (implementation-plan.md), .gitignore additions (.env*, code-bundle.txt).
7. Create the folder skeleton from implementation-plan.md §3 with .gitkeep where empty, and tell me to copy all docs into /docs.
8. Temporary src/app/page.tsx: centred card "Payonidhi Dairy – setup OK" with a shadcn Button and the Hindi text "दूध का हिसाब".
9. README.md skeleton: project summary, requirements (Node LTS), setup steps, scripts table.
10. Git: I already have an EMPTY GitHub repo. Give the commands to init git, make the first commit, add my repo as origin (placeholder https://github.com/<me>/<repo>.git), and push to main. If the repo isn't empty (has a README/licence), show how to pull/rebase first.

Tell me which Next.js version got installed and whether the middleware file is proxy.ts or middleware.ts for that version; put these in the progress.md "Locked versions" table.
```
**Expected output:** commands (create-next-app, npm installs, shadcn), full config files (`prettier.config.mjs`, `vitest.config.ts`, `package.json` scripts section or full file, `.env.example`, `.gitignore`), `src/app/page.tsx`, `README.md`, a sample test, a folder tree, a progress update with the versions.
**You should see:** `npm run dev` → `http://localhost:3000` shows the "setup OK" card. `npm test` → 1 passing test. `npm run lint`, `npm run typecheck`, `npm run build` all succeed. Your GitHub repo shows the code + `docs/` folder.

> Optional now, required by P7.2: import the repo on **vercel.com → Add New Project** so every push gets a live URL (it'll fail to use the DB until env vars are added in P1.1; that's fine).

---

## P0.2 Core libraries + tests
**Attach:** `skill.md`, `progress.md`, `data-model.md` (§0), `design.md` (§2), `testing.md` (§2–3), `code-bundle.txt`
```text
STEP P0.2: Core libraries, theme tokens, fonts, and their unit tests.

Create:
1. src/lib/constants.ts: exactly the enums/constants in data-model.md §0 (+ TS types derived from them).
2. src/lib/dates.ts using date-fns + @date-fns/tz: todayKey(now?), toDateKey(date), parseDateKey(key), addDaysKey(key, n), diffDaysKey(a, b), monthKeyOf(key), monthDays(monthKey), currentShift(eveningStartsAt, now?), formatDateLabel(key, locale), formatMonthLabel(monthKey, locale), formatTime(date, locale), isValidDateKey, isValidMonthKey. All in Asia/Kolkata.
3. src/lib/units.ts: mlToLitres, litresToMl, formatLitres(ml, locale), formatRupees(paise), amountPaise(ml, ratePaise), isValidQtyMl (step 500 = QTY_STEP_ML, max 20000).
4. src/lib/phone.ts: normalisePhone, isValidPhone (regex in data-model.md §0).
5. src/lib/result.ts: ActionResult, ErrorCode (api.md §0), ok(), fail(), validationError(zodError).
6. src/lib/logger.ts: tiny structured logger (info/warn/error) that redacts keys named pin, pinHash, token, password.
7. src/lib/status-styles.ts: the status table in design.md §2 (bg, text, border classes, lucide icon name, i18n label key) for every CellState.
8. src/app/globals.css: Tailwind v4 + the shadcn theme variables with the colours in design.md §2 (light only), radius 12px.
9. src/app/layout.tsx: Inter + Noto Sans Devanagari via next/font with CSS variables, the Sonner Toaster, metadata (title "Payonidhi Dairy"), viewport (themeColor #1E40AF).
10. Unit tests in tests/unit for dates, units and phone covering EVERY case listed under "P0.2" in testing.md §3.
```
**Expected output:** 9 source files + 3 test files, complete.
**You should see:** `npm test` → all date/unit/phone tests pass (including the 00:30 IST case). The home page now uses the blue theme and the Devanagari font.

---

# PHASE 1: Database & data layer

## P1.1 Connection + models + health
**Attach:** `skill.md`, `progress.md`, `data-model.md`, `implementation-plan.md` (§5 note 7), `code-bundle.txt`
```text
STEP P1.1: MongoDB connection, all Mongoose models, health endpoint.

Do:
1. Short guide: create a free MongoDB Atlas M0 cluster in Mumbai, a DB user, network access, copy the URI into .env.local as MONGODB_URI (database name "payonidhi-dairy-dev").
2. src/lib/db.ts: connectDB() with a cached connection on globalThis, a clear error if MONGODB_URI is missing, 'server-only'.
3. src/models/: User, Customer, DeliveryEntry, CustomerPause, Substitution, Settings, AuditLog, EXACTLY per data-model.md (field names, types, enums from lib/constants, validators incl. qty step and dateKey regex, defaults, timestamps, ALL indexes incl. the unique ones). Export TS interfaces for each document. src/models/index.ts re-exports.
4. src/app/api/health/route.ts: GET → { ok, db: 'up'|'down', time } (no secrets), dynamic.
5. tests/integration/setup.ts using mongodb-memory-server (start/stop, clear collections between tests) + vitest config update for integration tests.
6. tests/integration/models.test.ts covering "P1.1" in testing.md §3.
```
**Expected output:** Atlas mini-guide, `db.ts`, 7 model files + index, the health route, test setup + model tests, an updated vitest config.
**You should see:** `http://localhost:3000/api/health` → `{"ok":true,"db":"up",…}`. `npm test` green (the duplicate entry is rejected). If you connected Vercel: add `MONGODB_URI` (dev DB) to the Vercel **Preview** env vars and check `/api/health` on the preview URL.

---

## P1.2 Audit helper, settings, scripts
**Attach:** `skill.md`, `progress.md`, `data-model.md`, `testing.md` (§2), `code-bundle.txt`
```text
STEP P1.2: Audit helper, settings service, create-admin and seed scripts.

Do:
1. src/lib/audit.ts: writeAudit({ actor, action, entity, entityId, summary, before, after, reason }), plus a diffFields(before, after, keys) helper that returns only the changed fields.
2. src/features/settings/service.ts: getSettings() (creates the default doc if missing; data-model.md §6), updateSettings(). src/features/settings/queries.ts wrapper with React cache.
3. scripts/create-admin.ts: CLI args --name --phone --pin; validates the phone (lib/phone) and PIN (min 6 digits for admin), hashes with bcryptjs (cost 10), refuses if the phone exists, loads .env.local.
4. scripts/seed.ts: refuses if NODE_ENV=production or the URI contains "prod". Wipes the dev collections (with a 3-second warning), creates settings, 1 admin (9000000001 / 123456), 3 hawkers (9000000002 / 1111, 9000000003 / 2222, 9000000004 / 3333), 30 realistic Indian customers (mix of Hindi and English names, Jodhpur-style addresses, varied morning/evening qty in 0.5 L steps, 2 with a rate override), route orders, 1 admin pause, 1 hawker pause (2 days), 1 past and 1 current substitute cover (hawker 2 covers hawker 1), and delivery entries for the last 45 days (≈90% delivered, some qty changes, ≈5% not_delivered with reasons, a few left unmarked) with correct snapshots (on cover days markedBy = the substitute, hawkerId = the absent hawker) and markedAt times between 5:30–8:00 AM / 5–7 PM IST.
5. tests/fixtures.ts implementing EXACTLY the fixtures in testing.md §2 (for later tests), with a loadFixtures() function.
```
**Expected output:** `audit.ts`, the settings service/queries, 2 scripts, `fixtures.ts`.
**You should see:** `npm run create-admin -- --name "Owner" --phone 98XXXXXXXX --pin 123456` → "Admin created". `npm run seed` → summary counts. Atlas Data Explorer shows all 7 collections with data.

---

# PHASE 2: Auth, shells & i18n

## P2.1 Authentication & authorisation
**Attach:** `skill.md`, `progress.md`, `api.md` (§0–2), `data-model.md` (§1), `design.md` (§4.1), `testing.md`, `code-bundle.txt`
```text
STEP P2.1: Phone + PIN authentication, sessions, DAL, role routing.

Follow the official Next.js authentication guide pattern (stateless session with jose + DAL), and api.md §0–2 exactly.
Do:
1. src/lib/session.ts: encrypt/decrypt (HS256, SESSION_SECRET), createSession(user) (expiry 30d hawker / 7d admin; cookie pd_session httpOnly, secure in prod, sameSite lax, path /), deleteSession().
2. src/lib/dal.ts ('server-only'): getSession() (cached; verifies the user exists, is active, sessionVersion matches), requireUser(), requireRole(roles) (redirect for pages; plus an action-safe variant that returns FORBIDDEN/UNAUTHENTICATED), assertHawkerOwnsCustomer(), assertDateEditable() (needs settings.hawkerEditDays; FUTURE_DATE / OUTSIDE_EDIT_WINDOW; returns { needsReason } for admin outside the window).
3. src/features/auth/schemas.ts + actions.ts: loginAction (generic error, lockout 5 tries → 15 min, audit auth.login_failed / auth.locked, lastLoginAt), logoutAction, changeOwnPinAction (sessionVersion++ and re-issue cookie), setLanguageAction (user + NEXT_LOCALE cookie).
4. src/app/login/page.tsx + a client LoginForm per design.md §4.1 (numeric inputs, +91 prefix, show/hide PIN, pending state, inline errors). Temporary English strings are OK here (i18n comes in P2.2) but keep them in a single object so they're easy to move.
5. proxy.ts (or middleware.ts per the locked version): optimistic redirect to /login if there's no cookie for /admin/* and /hawker/*; redirect logged-in users away from /login. Matcher excludes static files and /api/health.
6. src/app/page.tsx: redirect admin → /admin, hawker → /hawker/today, else → /login.
7. Minimal src/app/admin/layout.tsx and src/app/hawker/layout.tsx that call requireRole, with placeholder pages /admin and /hawker/today ("Hello {name}" + logout button).
8. Integration tests for every "P2.1" case in testing.md §3.
```
**Expected output:** session/DAL/auth files, the login page + form, proxy/middleware, the root redirect, 2 layouts + placeholder pages, auth tests.
**You should see:** log in as the seeded admin → `/admin` "Hello Owner". Log in as a hawker → `/hawker/today`. A hawker typing `/admin` → redirected. 5 wrong PINs → lock message. Tests green.

---

## P2.2 App shells + Hindi/English
**Attach:** `skill.md`, `progress.md`, `design.md` (§1–3, §4.6, §6–7), `api.md` (§9), `implementation-plan.md` (§3), `code-bundle.txt`
```text
STEP P2.2: next-intl (Hindi + English), admin & hawker shells, all route placeholders, hawker settings page.

Do:
1. next-intl WITHOUT i18n routing: src/i18n/request.ts reads the NEXT_LOCALE cookie → else the user's preferredLanguage → else 'hi'. Wire the plugin in next.config, NextIntlClientProvider in the root layout, <html lang> set dynamically.
2. messages/en.json and messages/hi.json: namespaces common, nav, auth, status, reason, shift, today, calendar, customers, hawkers, pause, substitution, reports, settings, errors (all ErrorCode keys), summary. Include the design.md §7 strings. Natural, simple Hindi (as spoken in Rajasthan), not overly formal. Move the login page strings into i18n.
3. Components: layout/HawkerShell (top bar + bottom tab bar with safe-area padding, active tab), layout/AdminShell (desktop sidebar ≥1024px, mobile top bar + Sheet menu + bottom bar), layout/LanguageToggle (calls setLanguageAction, then router.refresh), shared/PageHeader, shared/EmptyState, shared/ErrorState, shared/StatCard.
4. Placeholder page.tsx for EVERY route in api.md §9 (PageHeader + EmptyState "Coming in P#.#"), plus loading.tsx (skeleton) and error.tsx for the /admin and /hawker segments.
5. /hawker/settings fully working: language toggle, change-PIN form (react-hook-form + zod, uses changeOwnPinAction), logout with confirm dialog. Add the needed shadcn components (sheet, dialog, form, toggle-group, avatar, dropdown-menu, alert).
6. A test that en.json and hi.json have identical key sets.
```
**Expected output:** i18n config, 2 message files, 7+ components, ~20 placeholder pages, loading/error files, a working hawker settings page, a key-parity test.
**You should see:** on your phone (use `npm run dev -- -H 0.0.0.0` and open `http://<PC-LAN-IP>:3000`) a hawker sees the bottom tabs; on desktop the admin sees a sidebar. The हि/EN toggle switches every label and survives a reload.

---

# PHASE 3: Admin management

## P3.1 Hawkers + settings
**Attach:** `skill.md`, `progress.md`, `api.md` (§0, §1, §3, §8), `design.md` (§4.11, §4.15), `data-model.md` (§1, §6), `testing.md`, `code-bundle.txt`
```text
STEP P3.1: Hawker management and the admin settings page.

Do:
1. src/features/users/{schemas,service,queries,actions}.ts per api.md §3 (listHawkers with customerCount via aggregation, getHawker, create/update/resetPin/setActive with the "0 active customers" rule; sessionVersion++ on reset/deactivate; audits).
2. /admin/hawkers page: card list on mobile / table on desktop, [Add hawker] dialog, row menu (Edit, Reset PIN, Activate/Deactivate) with confirm dialogs and toasts. /admin/hawkers/[id] detail header (route order comes in P3.3).
3. /admin/settings: business form (businessName, hawkerEditDays 0–7, hawkerMaxPauseDays 1–7, showAmountToHawkers switch, eveningStartsAt time) using updateSettingsAction (in features/settings/actions.ts) with audit; show the current default rate read-only with the note "Change rate: coming in P3.3"; own change-PIN form and language toggle.
4. All strings in en/hi.
5. Integration tests for the users/settings cases in testing.md §3 (P3.x).
```
**Expected output:** the users feature module, settings actions, 3 pages + dialogs, i18n keys, tests.
**You should see:** add a hawker → he can log in on a phone (use the Vercel preview URL if connected). Reset his PIN → his phone gets logged out on the next click. Deactivating a hawker with customers is blocked with a clear message.

---

## P3.2 Customers
**Attach:** `skill.md`, `progress.md`, `api.md` (§4, §9), `design.md` (§4.3, §4.8–4.10, §5), `data-model.md` (§2), `testing.md`, `code-bundle.txt`
```text
STEP P3.2: Customer management (admin) + read-only customer list for hawkers.

Do:
1. src/features/customers/{schemas,service,queries,actions}.ts per api.md §4: listCustomers (search on name/phone/address/area, filters, pagination, sort; hawker forced to own customers; 'paused' status = has a pause covering today), getCustomer (DTO, rate hidden for hawker unless allowed), create (routeOrder = last+10), update, reassign, deactivate (endDate), reactivate. Audits with diffFields.
2. shared/QtyStepper per design.md §5 (shows litres, step 500 ml, min 0, max 20 L, 48px buttons, accessible).
3. admin/DataTable: a reusable TanStack Table wrapper (shadcn pattern) with server-side pagination/sort/search via URL search params.
4. /admin/customers: table on desktop, cards on mobile, search box (debounced), hawker + status filters, row actions. /admin/customers/new and /admin/customers/[id]/edit: one CustomerForm (react-hook-form + zod; sections Details / Delivery / Rate; litres in the UI, ml in the payload; the "use default rate" checkbox).
5. /admin/customers/[id]: header card (details, hawker, defaults, rate, status, action buttons: Edit, Reassign dialog, Deactivate/Reactivate dialog) + Tabs: Calendar (placeholder "P5.1"), Pauses (placeholder "P3.3"), Activity (placeholder "P5.2").
6. /hawker/customers: search + list in route order (name, area, ☀/🌙 qty, pause badge), linking to /hawker/customers/[id] (placeholder page with the customer header only).
7. i18n keys + integration tests for the customer cases in testing.md §3 (incl. the hawker isolation test).
```
**Expected output:** the customers module, QtyStepper, DataTable, CustomerForm, 5 pages, i18n, tests.
**You should see:** create, search, filter, edit, reassign and deactivate customers. A hawker sees only his own customers in route order.

---

## P3.3 Route order, admin pauses, substitutes, rate change
**Attach:** `skill.md`, `progress.md`, `plan.md` (§7.4, §8 rules 12–13), `api.md` (§4 reorder/changeRate, §5), `design.md` (§4.10–4.11, §4.15), `data-model.md` (§3–5, §8 access logic), `testing.md`, `code-bundle.txt`
```text
STEP P3.3: Route ordering, admin pauses, substitute hawkers (leave cover), rate change with effective date.

Do:
1. reorderRouteAction + the route order UI on /admin/hawkers/[id]: list with ↑/↓ buttons (mobile) and a @dnd-kit drag handle (desktop), [Save order] (disabled until changed), validation that all ids belong to that hawker.
2. src/features/pauses/*: listPauses (status upcoming/active/ended/cancelled, createdByRole), createPauseAction (admin, overlap check ignoring cancelled), endPauseAction, cancelPauseAction (admin part now; hawker rules come in P4.1). Pauses tab on /admin/customers/[id]: list with a "by admin / by hawker" tag + AdminPauseDialog (date range with an "until resumed" option, shift both/morning/evening, reason) + End / Cancel.
3. src/features/substitutions/: coverage.ts (pure: activeCoversFor, coveredHawkerIds, canHawkerAccessCustomer per data-model.md §8) + schemas/service/queries/actions per api.md §5 (list, getActiveCoversForHawker, create, update (shorten/extend), cancel) with ALL rules of plan.md §8 rule 13 and audits. UI: the "Leave & cover" card + SubstitutionDialog on /admin/hawkers/[id], and a "Current covers" strip on /admin/hawkers (design.md §4.11).
4. changeRateAction (api.md §4): scope default|customer, effectiveFrom; a preview count query before confirming ("This will update N entries"); updates the settings/customer and re-prices entries; audit customer.rate_change / settings.update. UI: a "Change rate" dialog on /admin/settings (default) and on the customer header (customer).
5. Add the shadcn calendar/popover/radio-group/switch/textarea components as needed; a shared DatePicker that returns a dateKey.
6. i18n + tests: unit tests for coverage.ts; integration tests for reorder, pause overlap, substitution rules (overlap, self, chain, inactive, >31 days, cancel started, shorten) and rate re-pricing (testing.md §3 P3.x).
```
**Expected output:** the reorder action + UI, the pauses module + tab, the substitutions module (coverage.ts + service/actions + dialog/list), the rate-change action + dialogs, DatePicker, tests.
**You should see:** drag/arrow reordering persists. A paused customer shows a "Paused" badge. "Suresh covers Ramesh 10–15 Nov" appears on both hawkers' pages; an overlapping cover is rejected with a clear message. The rate-change preview shows a count and applies it.

---

# PHASE 4: Daily delivery marking (CORE)

## P4.1 Delivery engine (logic + actions + tests)
**Attach:** `skill.md`, `progress.md`, `data-model.md` (§3, §8), `api.md` (§0, §6), `plan.md` (§8), `implementation-plan.md` (§5), `testing.md`, `code-bundle.txt`
```text
STEP P4.1: The delivery engine. This is the most important step. Correctness over speed.

Do:
1. src/features/deliveries/expected.ts: pure functions scheduledQtyMl, isActiveOn, pauseCovers (ignores cancelled), resolveCell, isExpected EXACTLY per data-model.md §8 (no DB/Next imports). There are NO holidays.
2. src/features/deliveries/totals.ts: pure computeMonthTotals(cells, entries) per data-model.md §8 "Monthly totals" (sum of per-entry rounded amounts).
3. src/features/deliveries/schemas.ts: MarkDeliveryInput (discriminated union on status: delivered → quantityMl valid step >0; not_delivered → reason, note required if 'other'), UnmarkInput, MarkAllInput, TodaySheetInput.
4. src/features/deliveries/service.ts: markDelivery (findOneAndUpdate upsert, $setOnInsert snapshots defaultQtyMl/ratePaise/hawkerId/markedBy/markedAt; on update set updatedBy + $inc editCount; retry once on E11000), unmarkDelivery, markAllRemaining (server-computed unmarked list, bulkWrite upsert with $setOnInsert only), getTodaySheet (returns { own, covering[] } per api.md §6: own section + one section per hawker he covers on dateKey via coveredHawkerIds; few queries, no N+1; splits todo/done/inactive in route order; progress per section). Each write → writeAudit with diffFields and a human summary like "Sharma ji 12 Nov morning: 1.5 L → 2 L".
5. src/features/deliveries/actions.ts: markDeliveryAction, unmarkDeliveryAction, markAllRemainingAction following the api.md §0 order: requireRole → zod → assertHawkerOwnsCustomer(session, customerId, dateKey) (own OR active cover on that date, using coverage.ts) → assertDateEditable (admin outside window requires correctionReason → audit delivery.admin_correct) → service → revalidatePath. markAllRemaining accepts forHawkerId only via assertCanActForHawker. The entry hawkerId snapshot always comes from the customer doc; markedBy from the session. queries.ts: getTodaySheet wrapper (hawker = self; admin = any hawkerId).
5b. Hawker pauses in src/features/pauses/actions.ts: createHawkerPauseAction and the hawker branch of cancelPauseAction with ALL rules of plan.md §8 rule 12 (own/covered customer, fromDate today|tomorrow, days ≤ settings.hawkerMaxPauseDays, toDate computed, no overlap, cancel only own & not started).
6. Tests: tests/unit/expected.test.ts + totals.test.ts, tests/integration/deliveries.test.ts, tests/integration/substitute-access.test.ts and tests/integration/hawker-pauses.test.ts implementing EVERY "P4.1" case in testing.md §3 (incl. 10 parallel marks → exactly 1 entry, the substitute cases and the hawker-pause cases).
No UI in this step.
```
**Expected output:** 6–7 source files + 5 test files, with long, thorough tests.
**You should see:** `npm test` → all delivery tests pass (idempotency, permissions, edit window, pauses, substitute access, bulk). This is the gate for the rest of the app; don't continue until it's green.

---

## P4.2 Today screen (hawker + admin)
**Attach:** `skill.md`, `progress.md`, `design.md` (§1, §2, §4.2, §5, §6), `api.md` (§6, §9), `code-bundle.txt`
```text
STEP P4.2: The Today screen: the hawker's main screen (also used by admin at /admin/today).

Build exactly design.md §4.2:
1. /hawker/today?date=&shift= (Server Component): defaults: date = todayKey, shift = currentShift(settings.eveningStartsAt). Validates the params (date within the hawker window; otherwise redirect to today). Loads getTodaySheet.
2. shared/DateNav (prev/next bounded: next disabled at today, prev disabled at the window start for hawkers) + shift ToggleGroup (☀/🌙), synced to the URL.
3. Progress header: bar + "32/48 done · 51.5 L · 2 ✗ · 14 left".
4. deliveries/DeliveryCard: route no., name, address, QtyStepper (local qty), [✗ Not given] and big green [✓ Delivered] (56px, right side). Uses useOptimistic + useTransition; disables its own buttons while pending; on success moves to DONE with toast "Name: 1.5 L ✓" + Undo (5s → unmarkDeliveryAction); on failure rolls back + error toast (translated) with Retry.
5. deliveries/NotDeliveredSheet (shadcn Drawer): large radio rows for the reasons + a note (required for Other) + Save.
6. DONE section (collapsible) with compact rows (✓/✗, qty, a dot if qty ≠ default, time, reason); tap → deliveries/EntryEditSheet (status toggle, stepper, reason, Save, Remove mark with confirm).
7. PAUSED section (grey, collapsible; "by you" tag + Cancel on his own not-started pauses). Read-only banner if outside the window. EmptyState if no customers.
7b. Card ⋯ menu (Pause / Call / Open calendar) → pauses/HawkerPauseSheet (design.md §4.2: day chips 1..hawkerMaxPauseDays, Today/Tomorrow, shift, reason) → createHawkerPauseAction; the card moves to PAUSED.
7c. deliveries/CoveringSection: for each covering section, a "🔁 Covering for {name} (till {date})" block with its own progress, TO DO / DONE / PAUSED lists using the same cards, and its own BulkMarkButton (forHawkerId).
8. deliveries/BulkMarkButton: sticky above the tab bar for the own list (inline at the end of a covering section), "Mark all {n} remaining delivered", confirm dialog, calls markAllRemainingAction, toast with the count. Hidden when n = 0.
9. Offline banner (navigator.onLine + online/offline events).
10. /admin/today?hawkerId=&date=&shift=: hawker select + the same components (admin can go to any past date; correction reason prompt when outside the window).
11. Add the shadcn drawer, progress, radio-group, collapsible if missing. All strings i18n. Keep /hawker/today JS small (no charts/tables imported).
```
**Expected output:** 2 pages, DateNav, the progress header, DeliveryCard, NotDeliveredSheet, EntryEditSheet, HawkerPauseSheet, CoveringSection, BulkMarkButton, an offline banner hook, i18n keys.
**You should see:** **on a real phone** as a seeded hawker: tap ✓ → the card moves to Done instantly; Undo works; + / − changes qty; Not given asks for a reason; "Mark all remaining" works; yesterday is editable, 2 days ago is blocked; airplane mode → an error toast and nothing is falsely saved. ⋯ → Pause 2 days moves the customer to Paused. Log in as the seeded substitute → the "Covering for …" section appears and works. The admin sees the same at `/admin/today`.

---

# PHASE 5: Calendars & corrections

## P5.1 Customer month calendar
**Attach:** `skill.md`, `progress.md`, `design.md` (§2, §4.4, §4.10), `data-model.md` (§8), `api.md` (§6 getCustomerMonth), `testing.md`, `code-bundle.txt`
```text
STEP P5.1: Customer month calendar (shared by hawker and admin) with the day detail sheet.

Do:
1. getCustomerMonth({ customerId, monthKey }) in deliveries/queries.ts + service: loads the customer, the month's entries and pauses → resolveCell for every day × shift → days[] + computeMonthTotals. Permission: admin, the hawker who owns the customer, or a substitute whose cover includes today. Amount only if admin or showAmountToHawkers. Include markedByName for entries (one users lookup, no N+1).
2. calendar/MonthGrid (Monday-first 7-col grid, leading blanks, renderDay slot), calendar/DayCell (top half morning, bottom half evening; colour + icon + qty from status-styles; dot for qty ≠ default; today ring; future = faint planned qty; min 44×52px), legend.
3. shared/MonthPicker (‹ November 2026 ›, synced to ?month=; cannot go beyond the current month + 1).
4. calendar/DayDetailSheet: per shift: state badge, qty (default), marked by, time, edit count, reason/note; edit controls reusing the EntryEditSheet logic when editable (hawker: within window; admin: always, with a required "Reason for correction" field outside the window).
5. Month totals card (design.md §4.4); for admin, Copy summary/Print buttons as disabled placeholders ("P6.2").
6. Wire into /hawker/customers/[id] (plus a [‖ Pause] button opening HawkerPauseSheet and the list of upcoming pauses with Cancel for his own) and the Calendar tab on /admin/customers/[id]. In DayDetailSheet, show "by {name} (cover)" when markedBy ≠ the entry's hawkerId.
7. Integration tests for "P5.x getCustomerMonth" in testing.md §3.
```
**Expected output:** the query + service additions, MonthGrid, DayCell, MonthPicker, DayDetailSheet, a totals card, 2 pages wired, tests.
**You should see:** Sharma ji's month shows green/red/amber/grey cells exactly matching what was marked. Tapping a day shows who marked it and when. The totals match.

---

## P5.2 Master calendar, day register, corrections
**Attach:** `skill.md`, `progress.md`, `design.md` (§4.12–4.13), `api.md` (§6, §8), `testing.md`, `code-bundle.txt`
```text
STEP P5.2: Admin master calendar, day register with corrections, customer activity tab.

Do:
1. getMasterMonth({ monthKey, hawkerId? }): per day totalMl, delivered, notDelivered, unmarked, paused (computed with resolveCell over active customers, efficient: load customers/pauses/substitutions once, entries via one aggregation), covers[] labels like "Suresh → Ramesh".
2. /admin/calendar: hawker filter + MonthPicker; desktop grid cells (bold litres, ✓ ✗ ! counts, 🔁 cover tag); mobile list-by-day toggle; tap → /admin/calendar/[dateKey].
3. getDayRegister({ dateKey, hawkerId?, shift?, state? }) + /admin/calendar/[dateKey]: DateNav, filter chips, a summary bar, a table (desktop) / cards (mobile) with Customer, Hawker, Shift, Status badge, Qty (default), Marked by (with a "cover" badge when bySubstitute), Time, Edits, Reason/Note, [Edit]. Edit opens the entry sheet with the correction reason required outside the hawker window; also a "Mark" option for unmarked rows.
4. listAuditLogs({ entity, entityId }) query (features/audit) and the Activity tab on /admin/customers/[id] (timeline: time, actor, summary, before → after, reason). The full activity page comes in P6.3.
5. Integration tests for getMasterMonth and getDayRegister (testing.md §3 P5.x).
```
**Expected output:** 2 queries + services, 2 pages, the activity query + tab, tests.
**You should see:** the month grid with daily litres; open a day → every customer's status with the hawker and time; correct an old entry → asked for a reason → it appears in the customer's Activity tab with before/after.

---

# PHASE 6: Dashboard, reports, activity

## P6.1 Admin dashboard
**Attach:** `skill.md`, `progress.md`, `design.md` (§4.7), `api.md` (§7 getDashboard), `code-bundle.txt`
```text
STEP P6.1: Admin dashboard at /admin.

Do:
1. features/reports/service.ts + queries.ts: getDashboard({ dateKey }) per api.md §7. Hawker progress per shift (total expected, delivered, notDelivered, pending, coveredBy when a cover is active today), unmarkedYesterday list (respecting pauses), last30Days litres via aggregation. Efficient queries, no N+1.
2. /admin page: 4 StatCards, hawker progress list (progress bars per shift, link to /admin/today?hawkerId=), "Not marked yesterday" card with links to the day register, a 30-day bar chart (shadcn chart + Recharts, client component, lazy-loaded).
3. Empty states (no hawkers/customers yet → setup checklist: add hawker, add customers, set route order).
4. i18n keys. Integration test for getDashboard against the fixtures.
```
**Expected output:** reports service/queries (dashboard part), the dashboard page + chart component, i18n, a test.
**You should see:** `/admin` shows today's litres, each hawker's live progress (refresh after a hawker marks), yesterday's unmarked list and the chart.

---

## P6.2 Monthly reports, CSV, summary, hawker summary
**Attach:** `skill.md`, `progress.md`, `design.md` (§4.5, §4.14, §4.16), `api.md` (§7), `data-model.md` (§8), `testing.md` (§2 hand-calculated fixture), `code-bundle.txt`
```text
STEP P6.2: Monthly reports, CSV export, customer summary text + print view, hawker monthly summary.

Do:
1. getMonthlyReport({ monthKey, hawkerId? }): customers / hawkers / days tables + grand totals. Use aggregation for the entry sums (per-entry rounded amounts) and resolveCell for the unmarked/paused counts.
2. /admin/reports: MonthPicker + hawker filter, grand totals, Tabs (Customers / Hawkers / Days) with DataTable, an [Export CSV] button per tab, and a "Copy summary" row action.
3. GET /api/reports/monthly route handler (admin only via DAL → 403 otherwise): CSV with UTF-8 BOM, escaped quotes, litres as decimals, rupees as plain numbers, filename payonidhi-dairy-{type}-{month}.csv.
4. buildCustomerSummaryText({ customerId, monthKey, lang }) + a CopySummaryButton (navigator.clipboard, toast) on the customer calendar totals card and the report rows (replace the P5.1 placeholders).
5. Print view: /admin/customers/[id]/print?month= with @media print styles per design.md §4.16, footer "Delivery summary, not a bill"; the Print button opens it and calls window.print().
6. getHawkerMonthSummary + /hawker/summary per design.md §4.5 (no ₹ unless allowed).
7. Tests: the report for the testing.md §2 hand-calculated fixture must equal exactly 19,500 ml / 20 deliveries / 11 days / 1 not delivered / 117000 paise; the C2 snapshot rate; CSV format; summary text hi/en; hawker gets 403 on CSV.
```
**Expected output:** the report query/service, the reports page, the CSV route, the summary builder + button, the print page, the hawker summary page, tests.
**You should see:** month totals that match your own manual count; the CSV opens in Excel/Sheets with Hindi intact; Copy summary pastes nicely into WhatsApp; Print gives a clean one-page sheet.

---

## P6.3 Activity log page
**Attach:** `skill.md`, `progress.md`, `design.md` (§4.15), `api.md` (§8), `data-model.md` (§7), `code-bundle.txt`
```text
STEP P6.3: Full activity log page at /admin/activity.

Do:
1. Extend listAuditLogs with filters: date range (dateKeys → IST day bounds), actorId, entity, action prefix; pagination 50; actorName via lookup.
2. /admin/activity: filter bar (date range, user select, entity select), a timeline list grouped by day; each item: time, actor, translated action label, summary, expandable before → after table, reason. Mobile-friendly.
3. Translations for every action key in data-model.md §7.
4. Integration test: filters return the correct rows; a hawker cannot access it.
```
**Expected output:** query updates, the activity page + components, i18n, a test.
**You should see:** every mark, edit, correction, customer/rate/settings change listed with who, when and what changed.

---

# PHASE 7: Hardening & launch

## P7.1 Hardening + end-to-end tests
**Attach:** `skill.md`, `progress.md`, `testing.md` (§4–5), `design.md` (§6), `implementation-plan.md` (§6–8), `code-bundle.txt`
```text
STEP P7.1: Hardening and Playwright end-to-end tests.

Do:
1. Playwright setup (playwright.config.ts: webServer = build+start with a test DB URI from .env.test, projects Pixel 5 + Desktop Chrome, global setup that seeds fixtures). Implement ALL 10 scenarios in testing.md §5 using role/label selectors (add data-testid only where necessary).
2. Security headers in next.config (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy minimal, a basic CSP compatible with Next + next/font), poweredByHeader false.
3. Review every action/query for: requireRole first, Zod max lengths, ownership checks, no hawkerId from the client, no pinHash in DTOs. List what you checked in a table and fix any gaps.
4. Accessibility & UX pass: aria-labels, focus states, 360px layout issues, long Hindi strings overflowing, touch targets ≥48px. Fix the issues found.
5. Performance pass: confirm /hawker/today doesn't import charts/tables; add missing loading.tsx skeletons; check DB queries use indexes (explain key queries in a short note).
6. A GitHub Actions CI workflow: install, lint, typecheck, unit/integration tests, build (e2e optional/manual).
```
**Expected output:** Playwright config + 10 specs, next.config headers, an audit table + fixes, a11y/perf fixes, a CI workflow.
**You should see:** `npm run test:e2e` → 10 scenarios pass on mobile and desktop. CI is green on GitHub.

---

## P7.2 PWA install, deployment, backups, README
**Attach:** `skill.md`, `progress.md`, `implementation-plan.md` (§7), `testing.md` (§4 P7, §6), `code-bundle.txt`
```text
STEP P7.2: Make it installable, deploy to production, set up backups, finish the docs.

Do:
1. src/app/manifest.ts (name Payonidhi Dairy, short_name, start_url "/", display standalone, theme #1E40AF, background #F8FAFC) + icon files (give me an SVG source and the sizes to export: 192, 512, maskable 512, apple-touch 180) + apple-web-app meta. No service worker/offline (online only).
2. Step-by-step production guide for **Vercel Hobby (free) + Atlas M0 (free)**: production database (separate DB name or a separate free cluster), DB user, network access 0.0.0.0/0 with a strong password, connection string; import the GitHub repo in Vercel (if not done), Function region Mumbai (bom1), env vars (MONGODB_URI, SESSION_SECRET, APP_URL) for Preview vs Production; deploy by pushing to main; running create-admin against prod safely from my laptop; the free *.vercel.app URL (custom domain optional). Note the Hobby limits from implementation-plan.md §7.2 and how to upgrade later without code changes.
3. Backups: a GitHub Actions workflow (weekly + manual) that runs mongodump against prod and uploads an encrypted archive as a workflow artifact (or tells me how to use Atlas backups on a paid tier), plus a RESTORE drill guide using mongorestore into a scratch database.
4. Uptime: how to add a free uptime monitor on /api/health.
5. Final README.md: overview, screenshots placeholders, local setup, env vars, scripts, folder structure, deploy, backup/restore, troubleshooting (common errors: Atlas IP, SESSION_SECRET missing, timezone), how to use docs/ + prompts for future changes.
6. A launch checklist (pilot with one hawker for a week alongside paper; compare totals daily) as docs/launch-checklist.md.
```
**Expected output:** the manifest + icon instructions, a deployment guide, a backup workflow + restore guide, the final README, a launch checklist.
**You should see:** the live HTTPS URL works on 4G. "Add to Home screen" installs Payonidhi Dairy with its icon. The admin is created in prod. The backup workflow runs once successfully and the restore drill is done.

---

# 🔁 Utility prompts (use anytime)

## U1: Continue (answer was cut off)
```text
Continue exactly where you stopped. Start with the next file in your "CONTINUE NEEDED" list. Print complete files only, then Commands, Verify and the progress.md update.
```

## U2: Fix error
**Attach:** `skill.md`, `progress.md`, `code-bundle.txt` (or just the files involved)
```text
[Paste Prompt 00 first]
STEP: Fix an error in step P#.#.
What I did: <command / click>
What I expected: <…>
What happened (full error / screenshot text):
<paste the error>

Find the root cause (explain in 2–3 lines), then give the complete corrected files only, and how to verify the fix. Don't change unrelated code or the docs' names/scope.
```

## U3: Review a phase before moving on
**Attach:** `skill.md`, `progress.md`, `plan.md`, `testing.md`, the docs of that phase, `code-bundle.txt`
```text
[Paste Prompt 00 first]
STEP: Review Phase <N> (no new features).
Check the code against skill.md non-negotiables, plan.md business rules, data-model.md/api.md names, and the testing.md checks for this phase. Output: a table of findings (severity: blocker/major/minor, file, issue, fix), then complete corrected files for the blockers/majors only, and the progress.md update.
```

## U4: Change request (new idea or change in features)
**Attach:** all docs (no code needed)
```text
[Paste Prompt 00 first]
STEP: Change request (docs only, no code yet).
Change: <describe the change>
1. Tell me if it conflicts with plan.md non-goals (e.g. billing/payments are forbidden).
2. List every doc and section that must change, with the exact new text (old → new).
3. List which already-built steps need rework, and write a new prompt (same format as prompt.md) to implement it.
4. Give a progress.md "Change requests" row.
```

## U5: Explain the code to me (learning)
```text
[Paste Prompt 00 first]
STEP: Explain (no code changes). Explain how <feature, e.g. "marking a delivery from tap to database"> works in this codebase, file by file, in simple language (Hinglish is fine), with a small diagram.
```

## U6: New chat context summary (when a chat gets long)
```text
Summarise the current state of the Payonidhi Dairy project from this conversation as a "Current state" block for progress.md: last completed step, files created/changed, decisions, known issues, next step. Max 15 lines.
```
