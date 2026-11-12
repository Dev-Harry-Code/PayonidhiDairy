# progress.md — Build Tracker (living document)

> Attach this file to **every** prompt. At the end of each prompt the AI gives you an update block: paste it here, then `git commit`.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Current state (keep this short; it's the AI's "memory")
- **Current step:** MVP.2 (authentication and shells next)
- **Last completed step:** MVP.1 / Phase 1 database foundation
- **App runs?** yes (`npm run start` starts Next.js on port 3000)
- **GitHub repo:** _(paste URL)_
- **Live URL (Vercel):** n/a
- **Notes for next session:** start with Prompt 00 + P0.1

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
- [ ] **P2.1** session, DAL, login/lockout, logout, change PIN, role redirects, proxy/middleware
- [ ] **P2.2** next-intl, en/hi messages, AdminShell, HawkerShell, LanguageToggle, placeholder pages, hawker settings
- [ ] Gate (manual: phone login both roles)

## Phase 3: Admin management
- [ ] **P3.1** Hawkers CRUD, reset PIN, (de)activate, admin settings page
- [ ] **P3.2** Customers table, form, deactivate/reactivate, reassign, detail skeleton, hawker customer list
- [ ] **P3.3** Route order, admin pauses, substitutes (leave cover), rate change
- [ ] Gate

## Phase 4: Daily delivery marking (core)
- [ ] **P4.1** expected.ts, totals.ts, delivery service + actions + getTodaySheet (own + covering), substitute access, hawker pauses, audit, tests
- [ ] **P4.2** Today screen (hawker + admin), cards, stepper, sheets, hawker pause sheet, covering sections, bulk, optimistic + undo, banners
- [ ] Gate (manual: full shift on a real phone)

## Phase 5: Calendars & corrections
- [ ] **P5.1** MonthGrid, CustomerMonthCalendar, DayDetailSheet, getCustomerMonth, totals
- [ ] **P5.2** Master calendar, day register, admin corrections with reason, customer activity tab
- [ ] Gate

## Phase 6: Dashboard, reports, activity
- [ ] **P6.1** Dashboard
- [ ] **P6.2** Monthly report, CSV, copy summary, print view, hawker summary
- [ ] **P6.3** Activity log page
- [ ] Gate (report = hand-calculated fixture)

## Phase 7: Hardening & launch
- [ ] **P7.1** E2E tests, security headers, a11y/360px/Hindi/perf passes
- [ ] **P7.2** PWA manifest, Atlas prod, Vercel deploy, backups, final README
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
| | | | |

## Change requests
| # | Request | Docs changed | Implemented in |
|---|---|---|---|
| | | | |
