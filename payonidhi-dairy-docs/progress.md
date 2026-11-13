# progress.md — Build Tracker (living document)

> Attach this file to **every** prompt. At the end of each prompt the AI gives you an update block: paste it here, then `git commit`.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Current state (keep this short; it's the AI's "memory")
- **Current step:** launch handoff / manual pilot verification
- **Last completed step:** MVP.7 / hardening and launch preparation
- **App runs?** yes (`npm run start` starts Next.js on port 3000)
- **GitHub repo:** _(paste URL)_
- **Live URL (Vercel):** n/a
- **Notes for next session:** configure production hosting and run the one-week pilot

## Locked versions (fill in after P0.1)
| Package | Version |
|---|---|
| node | `v24.21.0` |
| next | `16.4.6` |
| react | `19.3.0` |
| typescript | `5.9.3` |
| tailwindcss | `4.3.3` |
| mongoose | `9.12.1` |
| zod | `4.6.7` |
| next-intl | `4.15.1` |
| middleware file name | `proxy.ts` (Next 16 convention) |

---

## Phase 0: Project setup & foundations
- [x] **P0.1** Scaffold & tooling (Next app, Tailwind, shadcn, ESLint/Prettier, Vitest, env, scripts, docs/, README, git)
- [x] **P0.2** Core libs + tests (constants, dates, units, phone, result, logger, status-styles, theme tokens, fonts)
- [x] Gate: lint / typecheck / test / build green · commit pending user

## Phase 1: Database & data layer
- [x] **P1.1** db connection, MVP models (User, Customer, DeliveryEntry, Settings, AuditLog) + indexes, /api/health
- [x] **P1.2** audit helper, getSettings, create-admin script, seed script
- [x] Gate: lint / typecheck / test / build green · commit pending user

## Phase 2: Auth, shells & i18n
- [x] **P2.1** session, DAL, login/lockout, logout, change PIN, role redirects, proxy/middleware
- [x] **P2.2** MVP admin/hawker shells and protected routes; full next-intl/Hindi coverage deferred post-MVP
- [x] Gate: lint / typecheck / test / build green · manual database login pending

## Phase 3: Admin management
- [x] **P3.1** MVP hawker create/list and account foundation; reset/settings/full edit UI deferred
- [x] **P3.2** MVP customer create/list, assignment, quantities, and hawker customer list; detail/deactivate/reassign UI deferred
- [ ] **P3.3** Route order, admin pauses, substitutes (leave cover), rate change
- [x] Gate: lint / typecheck / test / build green · commit pending user

## Phase 4: Daily delivery marking (core)
- [x] **P4.1** MVP expected-state logic, delivery actions, upsert/unmark/bulk, audit, and Today query; substitutes/pauses deferred
- [x] **P4.2** MVP hawker Today screen with shift switching, delivery marking, undo, quantity increment, and bulk mark
- [x] Gate: lint / typecheck / test / build green · real-phone manual check pending user

## Phase 5: Calendars & corrections
- [x] **P5.1** Customer month calendar, delivery-state cells, and monthly totals for admin/hawker
- [ ] **P5.2** Master calendar, day register, admin corrections with reason, customer activity tab (deferred)
- [x] Gate: lint / typecheck / test / build green · commit pending user

## Phase 6: Dashboard, reports, activity
- [x] **P6.1** MVP admin dashboard with today totals and hawker progress
- [x] **P6.2** MVP monthly report with customer totals and informational reference amount; CSV/copy/print deferred
- [ ] **P6.3** Activity log page
- [x] Gate: lint / typecheck / test / build green · commit pending user

## Phase 7: Hardening & launch
- [x] **P7.1** Security headers, error boundary, not-found page, and production verification
- [x] **P7.2** PWA manifest, production environment checklist, and final README guidance; hosting/backups require owner credentials
- [ ] Launch: 1-week pilot with one hawker

---

## Decision log
| Date | Decision | Why | Docs updated |
|---|---|---|---|
| 2026-11-12 | No billing/payments; reference ₹ only | Owner's instruction | plan.md |
| 2026-11-12 | Admin + hawkers; phone + PIN; milk only; morning+evening; Hindi+English; admin-only customer edits; online only; 150–600 customers | Q&A round 1–2 | all |
| 2026-11-12 | Name **Payonidhi Dairy**; hawker short pauses (≤3 days); substitute hawker feature; qty step 0.5 L; holidays dropped; Vercel Hobby + GitHub; Next.js confirmed | Q&A round 3 | all |
| 2026-11-12 | One-week MVP: 45–65 focused hours; delivery marking, basic records, calendar, totals, auth, audit, deployment first; deferred features remain post-MVP | scope.md, all implementation docs |

## Known issues / tech debt
| # | Issue | Found in | Status |
|---|---|---|---|
| 1 | Full next-intl language toggle and Hindi message coverage | MVP.2 | Deferred post-MVP |
| 2 | Full management CRUD/detail/deactivation/reassignment screens | MVP.3 | Deferred post-MVP |
| 3 | Substitutes, pauses, admin corrections, and advanced Today sections | MVP.4 | Deferred post-MVP |

## Change requests
| # | Request | Docs changed | Implemented in |
|---|---|---|---|
| | | | |
