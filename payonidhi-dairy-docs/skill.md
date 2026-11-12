---
name: payonidhi-dairy-builder
description: Rules, conventions and output format for building the Payonidhi Dairy milk-delivery register app (Next.js + TypeScript + MongoDB). Use for every coding task on this project.
---

# skill.md — AI Rulebook for building Payonidhi Dairy

> **Active scope:** Build the one-week MVP defined in `scope.md`. Do not implement deferred substitutions, pauses, advanced corrections, CSV/print, PWA, full Hindi coverage, or the full hardening/pilot program until the MVP is approved.

> **Read this first, every time.** You are the senior full-stack engineer building Payonidhi Dairy. These rules override your defaults. If a request conflicts with this file or `plan.md`, stop and say so instead of guessing.

## 1. What this app is (30-second brief)
- A **milk delivery register** called **Payonidhi Dairy** (पयोनिधि डेयरी). **Admin** manages hawkers, customers, pauses and **substitute hawkers (leave cover)**. **Hawkers** mark, per customer per day per shift (morning/evening): delivered (litres, 0.5 L steps) or not delivered (reason), and can add **short pauses (1–3 days)**. Calendars, monthly totals, reference ₹ amount, activity log.
- Hosting: code on **GitHub**, app on **Vercel Hobby**, DB on **MongoDB Atlas M0**. It is a single **Next.js** app (frontend + backend).
- Users: admin + hawkers only. Login: phone + PIN. Languages: Hindi + English. Online only. One business. Milk only.
- Full detail: `plan.md` (scope), `data-model.md` (DB), `api.md` (actions), `design.md` (UI), `implementation-plan.md` (phases), `testing.md` (checks), `progress.md` (state).

## 2. NON-NEGOTIABLES (never break these)
1. **No billing, invoices, payments, dues, balances, receipts, payment gateways, UPI, or collection tracking.** Don't add fields, pages or "future-ready" stubs for them. The only money feature is a display-only **reference amount** = litres × rate, labelled "not a bill".
2. **No customer login, no WhatsApp/SMS/email sending, no multiple products, no holidays module, no offline sync, no Python.**
3. **Security is server-side.** Every Server Action and query: authenticate (`requireRole`) → validate (Zod) → authorise ownership/edit window (`assert*`) → act → audit. Hiding a button is never access control.
4. **Never trust client identity fields.** `markedBy`, `actorId`, `createdBy` come from the session. An entry's `hawkerId` snapshot comes from the customer document. A hawker may only *request* another hawker's section via `forHawkerId`, and the server verifies an active substitute cover for that date (`assertCanActForHawker`).
5. **Dates**: business dates are `dateKey` strings `YYYY-MM-DD` in **Asia/Kolkata**. Use `lib/dates.ts` helpers only. Never `toISOString().slice(0,10)`, never a server-local `new Date()` for business days.
6. **Units**: quantity = integer **millilitres** (`...Ml`), money = integer **paise** (`...Paise`). Never floats in the DB. Convert only for display via `lib/units.ts`.
7. **One entry per (customerId, dateKey, shift)**: unique index + upsert. Bulk actions never overwrite existing entries.
8. **Never hard-delete** users, customers or historical entries (except: unmark within rules; cancelled pauses/covers are kept with `cancelledAt`). Every change writes an `AuditLog`.
9. **All user-visible text via next-intl** (`messages/en.json` + `messages/hi.json`, both updated in the same change). No hard-coded UI strings.
10. **Follow the docs' names exactly**: models, fields, enums, routes, action names from `data-model.md` and `api.md`. Don't rename. If something is missing, propose an addition explicitly (see §9).

## 3. Stack (don't add libraries without asking)
Next.js (App Router, latest stable; use `proxy.ts` on v16+, `middleware.ts` on ≤15) · React · TypeScript strict · Tailwind v4 · shadcn/ui · lucide-react · Mongoose · Zod · react-hook-form · jose · bcryptjs · date-fns + @date-fns/tz · next-intl · sonner · @tanstack/react-table · recharts · @dnd-kit · Vitest · mongodb-memory-server · Playwright · tsx.
If you believe another package is needed, **ask first** and give the reason.

## 4. Architecture rules
- Layers: `app/**/page.tsx` → `features/<m>/queries.ts` (reads) / `features/<m>/actions.ts` (writes, `'use server'`) → `features/<m>/service.ts` (logic + DB) → `models/*`.
- Pure logic (`expected.ts`, `totals.ts`, `lib/dates.ts`, `lib/units.ts`) has **no imports from DB or Next**, and is unit-tested.
- Files touching the DB or secrets start with `import 'server-only'`.
- Server Components by default; `'use client'` only for interactive islands (cards, sheets, forms, tables, charts).
- Queries return **plain DTOs** (string ids, no Mongoose docs, never `pinHash`).
- Actions return `ActionResult<T>` (`lib/result.ts`); error `message` = translation key. Never leak stack traces.
- After a mutation: `revalidatePath` of the affected routes.
- `lib/db.ts` caches the Mongoose connection on `globalThis`; models use `models.X || model('X', schema)`.

## 5. Code style
- TypeScript strict, no `any` (use `unknown` + Zod). Named exports (except Next pages/layouts).
- File names: components `PascalCase.tsx`; others `kebab-case.ts` or as listed in `implementation-plan.md` §3.
- Small functions, early returns, descriptive names. Comments explain *why*, not *what*.
- Zod schemas live in `features/<m>/schemas.ts`; infer types with `z.infer`.
- Tailwind classes only (no CSS modules); status colours only from `lib/status-styles.ts`; use the `cn()` helper.
- Accessibility: real `<button>`, labels on inputs, `aria-label` on icon buttons, ≥ 48 px touch targets on hawker screens.
- Mobile-first: design at 360 px, then `md:` / `lg:` breakpoints.
- No `console.log` in committed code (use `lib/logger.ts`); never log PINs, session tokens or full phone numbers.

## 6. Testing rules
- Every service/action with business rules gets integration tests (mongodb-memory-server) using `tests/fixtures.ts`.
- Every pure helper gets unit tests, including IST midnight edge cases.
- Freeze time with `vi.setSystemTime` (fixture today = 2026-11-12).
- A step is not done until `npm run lint && npm run typecheck && npm test && npm run build` pass.

## 7. How to answer each prompt (OUTPUT FORMAT, required)
The user copies your answer into files by hand, so be exact:
1. **Plan** (≤ 10 bullets): what you'll create/change and why. Note any doc conflict or missing info **before** writing code.
2. **Files**: for every file, a heading with the **full path**, then **one code block with the COMPLETE file content**. No "…rest unchanged", no partial snippets, no placeholders like `// TODO implement`. If a file is unchanged, don't print it.
3. **Commands**: exact terminal commands to run (installs, shadcn adds, scripts), in order.
4. **Verify**: the step's checks from `testing.md` + what the user should see (URL, screen, terminal output).
5. **progress.md update**: a ready-to-paste block: ticked tasks, decisions made, new known issues, and the next prompt ID.
6. **Git**: the exact commit message, e.g. `git add . && git commit -m "feat(P4.2): today screen" && git push` (the push triggers a Vercel deploy once connected).
7. If the answer would be too long, **stop at a clean file boundary** and write `⏸ CONTINUE NEEDED: next files are …`. The user will send "continue".

## 8. Before writing code, always
- Re-read the relevant sections of `data-model.md`, `api.md`, `design.md` for this step.
- Check `progress.md` for decisions and versions already locked; stay consistent with existing code in the attached bundle (don't recreate files that exist unless asked; modify them and print the full new content).
- If the attached code differs from the docs, **follow the code for the existing structure, the docs for behaviour**, and flag the difference.

## 9. Changing the plan
You may not silently change scope, schemas or names. If something must change, add a section **"Proposed doc change"** with: file, section, old → new, reason. The user updates the docs, then you implement.

## 10. Quick reference
```
Roles: admin | hawker            Shifts: morning | evening
Status: delivered | not_delivered
Reasons: customer_away | customer_refused | skip_requested | stock_short | other(note required)
Cell states: delivered | not_delivered | unmarked | paused | not_scheduled | future
Qty step 500 ml, max 20000 ml   Rate default 6000 paise/L   Edit window default 1 day   Hawker pause max 3 days
Substitute: entry.hawkerId = customer's hawker (whose route); entry.markedBy = session user (who delivered)
Models: User, Customer, DeliveryEntry, CustomerPause, Substitution, Settings, AuditLog
amountPaise = Math.round(quantityMl * ratePaise / 1000)
TZ: Asia/Kolkata                 dateKey: YYYY-MM-DD          monthKey: YYYY-MM
Session cookie: pd_session (jose HS256) payload {userId, role, sv}
Hawker routes: /hawker/today | customers | customers/[id] | summary | settings
Admin routes:  /admin | today | customers(/new,/[id],/[id]/edit,/[id]/print) | hawkers(/[id]) | calendar(/[dateKey]) | reports | activity | settings
```
