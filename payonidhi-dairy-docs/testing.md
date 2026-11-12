# testing.md — Tests & Acceptance Checks

> **MVP testing boundary:** For the one-week release, prioritize auth/role checks, delivery marking/idempotency, audit records, customer calendar, monthly totals, responsive phone layout, and the four required quality commands. Playwright breadth, accessibility/performance audits, and pilot validation are post-MVP.

> What "working" means for each phase. The AI writes the automated tests; you run the manual checks. Step IDs match `implementation-plan.md` and `prompt.md`.

---

## 1. Tools
- **Vitest**: unit tests (`tests/unit`) and integration tests (`tests/integration`) using **mongodb-memory-server** (no real DB needed).
- **Playwright**: end-to-end tests (`tests/e2e`) against `npm run build && npm start` with a seeded test DB; mobile viewport `Pixel 5` + desktop.
- Commands: `npm test`, `npm run test:e2e`.
- Always: `npm run lint && npm run typecheck && npm test && npm run build`.

## 2. Test fixtures (`tests/fixtures.ts`)
Fixed "today" = **2026-11-12** (mock time with `vi.setSystemTime`). Settings: rate ₹60/L (6000 paise), `hawkerEditDays = 1`, `hawkerMaxPauseDays = 3`.
| Fixture | Data |
|---|---|
| Admin | Owner, 9000000001, PIN 123456 |
| Hawker A | Ramesh, 9000000002, PIN 1111 |
| Hawker B | Suresh, 9000000003, PIN 2222 |
| C1 Sharma | Ramesh, morning 1500, evening 500, start 2026-11-01, rate null |
| C2 Gupta | Ramesh, morning 1000, evening 0, start 2026-11-01, rate 6400 |
| C3 Mehta | Ramesh, morning 1000, paused 2026-11-10 → 2026-11-15 (both) |
| C4 Jain | Suresh, morning 2000, evening 1000, start 2026-11-05 |
| Hawker C | Mahesh, 9000000004, PIN 3333 |
| C5 Verma | Mahesh, morning 1000, start 2026-11-01 |
| Cover S1 | Suresh (B) covers Ramesh (A), 2026-11-12 → 2026-11-14 |

### Hand-calculated month fixture (for the P6.2 report test)
November 1–11 for C1, all delivered at default except: 3rd morning not delivered (customer_away); 7th morning 2000 ml; 8th morning **left unmarked** (no entry):
- Morning: 11 days − 1 (3rd) − 1 (8th) = 9 deliveries: 8 × 1500 + 2000 = 14,000 ml
- Evening: 11 deliveries × 500 = 5,500 ml
- **Total = 19,500 ml = 19.5 L; deliveriesCount = 20; daysDelivered = 11; notDelivered = 1; unmarked (1–11 Nov) = 1; reference = 19.5 × ₹60 = ₹1,170 (117000 paise)**

## 3. Automated tests by step

### P0.2: libs
- `todayKey()` at `2026-11-11T19:00:00Z` (= 00:30 IST on the 12th) → `"2026-11-12"`. At `2026-11-11T18:00:00Z` (23:30 IST) → `"2026-11-11"`.
- `addDaysKey("2026-02-28", 1)` → `"2026-03-01"`; across month and year boundaries; leap year 2028-02-29.
- `monthDays("2026-11")` → 30 keys; `monthDays("2028-02")` → 29.
- `currentShift("13:59")` → morning, `("14:00")` → evening (with `eveningStartsAt "14:00"`).
- `formatLitres(1500)` → `"1.5 L"`, `(2000)` → `"2 L"`, `(500)` → `"0.5 L"`; `formatRupees(285000)` → `"₹2,850"`; `formatRupees(12500000)` → `"₹1,25,000"`.
- `amountPaise(1500, 6000)` → `9000`; `amountPaise(1500, 6333)` → `9500` (9499.5 rounds up); `isValidQtyMl(1000)` → true, `(750)` → false, `(0)` → false for delivered.
- `normalisePhone("+91 98765-43210")` → `"9876543210"`; invalid `"12345"` → null; `"5876543210"` → invalid.

### P1.1: models
- The unique index on `deliveryentries (customerId, dateKey, shift)` rejects a duplicate.
- Customer validation: qty not a multiple of 500 → error; both qty 0 → error; bad dateKey format → error.
- `users.phone` unique.

### P2.1: auth
- Correct phone + PIN → session cookie set, `lastLoginAt` updated.
- Wrong PIN ×5 → 6th attempt returns `LOCKED` even with the correct PIN; after 15 min (mocked) works.
- Deactivated user → login fails; an existing session becomes invalid (`getSession()` → null).
- PIN reset increments `sessionVersion` → old cookie rejected.
- Hawker calling an admin-only action → `FORBIDDEN`.

### P3.x: management
- Create customer → `routeOrder` = last + 10 for that hawker.
- Hawker phone duplicate → `CONFLICT`.
- Deactivate hawker with active customers → `CONFLICT`.
- `reorderRouteAction` rewrites orders 10, 20, 30 in the given order; a list with a customer of another hawker → `VALIDATION`.
- Pause overlap (same customer, overlapping dates and shift) → `CONFLICT`; a cancelled pause doesn't count as overlap.
- Substitution: B covers A 12–14 Nov → ok; a second cover for A overlapping 13–15 → `CONFLICT`; B covering B → `VALIDATION`; C covers B on 13 Nov while B covers A (chain) → `CONFLICT`; an inactive hawker → `VALIDATION`; > 31 days → `VALIDATION`; cancel a started cover → `CONFLICT`; shorten works; audits written.
- `coveredHawkerIds(subs, B, "2026-11-13")` → [A]; on "2026-11-15" → []; a cancelled cover → [].
- `changeRateAction(customer C2, 7000, from 2026-11-05)` re-prices only C2's entries with dateKey ≥ 2026-11-05; returns the count; audit written.
- `listCustomers` called by Hawker A never returns Suresh's customers, even if `hawkerId=B` is passed.

### P4.1: delivery engine (most important)
`resolveCell`:
- C1 2026-11-12 morning, no entry → `unmarked`; 2026-11-13 → `future`; entry exists → entry status.
- C2 evening → `not_scheduled` (qty 0).
- C3 2026-11-12 → `paused`; with an entry → the entry wins.
- C4 2026-11-04 → `not_scheduled` (before startDate).

Actions:
- Hawker A marks C1 today delivered (default) → entry with `quantityMl 1500`, `defaultQtyMl 1500`, `ratePaise 6000`, `hawkerId A`, `markedBy A`, `markedAt` set; audit `delivery.mark`.
- Same call twice → still **1** entry (idempotent), `editCount` unchanged or +1 but never a duplicate.
- 10 parallel calls (`Promise.all`) → exactly 1 entry.
- Edit qty 1500 → 2000 → `editCount 1`, `updatedBy` set, audit `delivery.edit` with before `{quantityMl:1500}` after `{quantityMl:2000}`.
- Hawker A marks C4 (Suresh's) → `FORBIDDEN`.
- Hawker A marks 2026-11-13 → `FUTURE_DATE`; 2026-11-10 → `OUTSIDE_EDIT_WINDOW`; 2026-11-11 → ok.
- Admin marks 2026-11-01 without `correctionReason` → `VALIDATION`; with a reason → ok, audit `delivery.admin_correct`.
- not_delivered without a reason → `VALIDATION`; reason `other` without a note → `VALIDATION`; delivered with qty 0 or 1300 → `VALIDATION`.
- `markAllRemainingAction` (A, today, morning) with C1 already marked → creates only C2 (C3 paused is skipped); returns `{count:1}`; does not change C1.
- Hawker C (Mahesh, no cover) bulk for `forHawkerId = A` → `FORBIDDEN`.

Substitute (cover S1: B covers A, 12–14 Nov; today = 12 Nov):
- `getTodaySheet` for B today → `own` = [C4], `covering` = one section for Ramesh with C1, C2 (C3 paused).
- B marks C1 today → ok; entry `hawkerId = A` (whose route), `markedBy = B` (who delivered).
- B marks C1 for 2026-11-11 (before the cover) → `FORBIDDEN` (even though it's inside the edit window).
- B `markAllRemainingAction({ forHawkerId: A })` today → marks A's unmarked customers only.
- A can still mark his own customers during the cover (no lock-out).
- B opens C1's calendar today → allowed; after the cover ends (mock 2026-11-15) → `FORBIDDEN`.

Hawker pauses:
- A pauses C1 from today, 2 days, both → ok, `toDate = 2026-11-13`, `createdByRole = 'hawker'`, audit `pause.create`.
- A pauses 4 days → `VALIDATION`; from yesterday → `VALIDATION`; from the day after tomorrow → `VALIDATION`.
- A pauses C4 (Suresh's) → `FORBIDDEN`; B (covering A today) pauses C2 → ok.
- A cancels his own pause starting tomorrow → ok; cancels one that started today → `CONFLICT`; cancels an admin pause → `FORBIDDEN`.
- After A's pause covers C1 today, C1 moves to `inactive` (paused) on the Today sheet, and bulk skips it.
- `unmarkDeliveryAction` → entry removed, cell back to `unmarked`, audit with before.
- `getTodaySheet` for A today morning → todo [C2] / done [C1] / inactive [C3], progress correct.

### P5.x: calendars
- `getCustomerMonth(C1, "2026-11")` → 30 days × 2 cells; the states match the fixture; totals match.
- Hawker A requesting C4's month → `FORBIDDEN`.
- `getMasterMonth` day totals = Σ entries of that day; the hawker filter works; cover days list "Suresh → Ramesh".
- `getDayRegister` rows marked by a substitute have `bySubstitute = true`.
- `getDayRegister(2026-11-12, state='unmarked')` → only unmarked rows.

### P6.x: reports
- The monthly report for the §2 fixture → C1 total 19,500 ml, deliveries 20, daysDelivered 11, notDelivered 1, reference 117000 paise.
- C2 entries use their snapshot rate 6400, not the default.
- CSV: starts with BOM, header row, quotes escaped (name `Ram "Bhai"`), Hindi name intact.
- `buildCustomerSummaryText` (hi & en) contains the month, days, litres, rate, amount and the "not a bill" line.
- Hawker cannot call `GET /api/reports/monthly` → 403.

## 4. Manual checks by phase (do these yourself)

| Phase | Check |
|---|---|
| P0 | `npm run dev` opens; the button is styled; Hindi text "दूध" renders in the Devanagari font |
| P1 | `/api/health` shows db up; Atlas shows the collections + indexes after the seed |
| P2 | Log in as admin and as hawker on your phone (use your PC's LAN IP or a Vercel preview); the language toggle switches all visible text; logout works; a hawker can't open `/admin` |
| P3 | Add a hawker and 3 customers; reorder; pause one; add a cover ("Suresh covers Ramesh tomorrow"); try an overlapping cover (blocked); change the rate with a preview |
| P4 | **On a real phone**: mark a full shift; ⋯ → Pause 2 days (customer moves to Paused; 4 days isn't offered); log in as the substitute and see "Covering for …" and mark it; try double-tapping; switch off the internet → an error toast appears, nothing is falsely shown as saved; undo works; "mark all remaining" works; yesterday is editable, the day before isn't |
| P5 | The calendar colours match the legend; tap a day → details show the hawker and time; an admin correction asks for a reason on old dates |
| P6 | Dashboard numbers = what you marked; CSV opens in Excel/Sheets with Hindi; Copy summary pastes nicely into WhatsApp; the print view looks clean |
| P7 | Install to the home screen on Android (Chrome → Add to Home screen); the production URL works on 4G; the backup/restore drill is done once |

## 5. End-to-end scenarios (Playwright, P7.1)
1. **Setup**: admin logs in → creates hawker "Test Hawker" → creates 3 customers assigned to him → reorders.
2. **Morning round (mobile viewport)**: hawker logs in → Today shows 3 in order → marks #1 delivered, #2 qty +0.5 then delivered, #3 not delivered (Customer away) → progress 3/3.
3. **Bulk**: new day → "Mark all remaining" → all delivered.
4. **Permissions**: hawker navigates to `/admin` → redirected; hawker opens another hawker's customer URL → not found/forbidden.
5. **Correction**: admin opens the day register for 3 days ago → edits qty with a reason → the activity log shows before/after.
6. **Report**: admin opens the monthly report → totals equal the marked data → CSV downloads.
7. **Language**: switch to Hindi → Today screen labels are in Hindi → reload keeps Hindi.
8. **Lockout**: 5 wrong PINs → locked message.
9. **Leave cover**: admin adds "Hawker B covers Test Hawker today" → B logs in → sees the "Covering for" section → marks 1 customer → the admin's day register shows marked by B, route of Test Hawker.
10. **Hawker pause**: hawker pauses a customer for 1 day from tomorrow → the admin sees it in the customer's Pauses tab tagged "by hawker" and in the activity log.

## 6. Launch acceptance (from plan.md §10)
All of `plan.md` §10 ticked + all automated tests green + manual P7 checks done + 1 week **pilot with one hawker** alongside the paper register, comparing totals daily.
