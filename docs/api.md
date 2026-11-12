# api.md — Server Actions, Queries & Endpoints

> **MVP boundary:** Prioritize authentication, basic hawker/customer records, delivery marking, audit, customer calendar, and monthly totals. Substitutions, pauses, advanced corrections, CSV, and activity UI are post-MVP.

> Every mutation is a **Next.js Server Action** in `src/features/<module>/actions.ts`. Every read is a **server-only query** in `src/features/<module>/queries.ts`, called from Server Components. Route Handlers (`src/app/api/...`) exist only for CSV export and health checks.
> Related: `data-model.md` (shapes), `plan.md` §8 (rules), `skill.md` (coding rules).

---

## 0. Conventions

### Result type (all actions)
```ts
// src/lib/result.ts
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> } };

export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND'
  | 'CONFLICT' | 'OUTSIDE_EDIT_WINDOW' | 'FUTURE_DATE' | 'LOCKED' | 'INTERNAL';
```
- `message` is a **translation key** (e.g. `errors.outsideEditWindow`), so the UI can show Hindi or English.
- Never throw raw errors to the client. Log server-side (`logger.error`) and return `INTERNAL`.

### Every action follows this order
```ts
'use server';
export async function someAction(input: unknown): Promise<ActionResult<X>> {
  const session = await requireRole(['admin']);        // 1. auth + role (src/lib/dal.ts)
  const parsed = SomeSchema.safeParse(input);           // 2. Zod validation (schemas.ts)
  if (!parsed.success) return validationError(parsed.error);
  // 3. ownership / business-rule checks (hawker owns customer, edit window, no future dates)
  // 4. DB write via service.ts
  // 5. audit log
  // 6. revalidatePath(...) for affected pages
  return { ok: true, data };
}
```

### Auth helpers (`src/lib/dal.ts`, `server-only`)
| Helper | Behaviour |
|---|---|
| `getSession()` | Decrypts the cookie, loads the user, checks `active` and `sessionVersion`; returns `SessionUser \| null` (cached per request with React `cache`) |
| `requireUser()` | Redirects to `/login` if there's no session |
| `requireRole(roles)` | `requireUser` + returns `FORBIDDEN` (actions) or redirects (pages) if the role doesn't match |
| `assertHawkerOwnsCustomer(session, customerId, dateKey)` | Hawker → allowed if `customer.hawkerId === session.userId` **or** he has an active substitute cover for `customer.hawkerId` on `dateKey` (`canHawkerAccessCustomer`, data-model.md §8); admin → always allowed |
| `assertCanActForHawker(session, forHawkerId, dateKey)` | Used when a hawker asks for another hawker's sheet/bulk action: allowed only with an active cover on `dateKey`. Admin → always |
| `assertDateEditable(session, dateKey)` | Future → `FUTURE_DATE`; hawker beyond `hawkerEditDays` → `OUTSIDE_EDIT_WINDOW`; admin → allowed (but needs a reason if beyond the window) |

---

## 1. Permission matrix

| Capability | Admin | Hawker |
|---|---|---|
| Log in / out, change own PIN & language | ✅ | ✅ |
| View own Today sheet & mark entries (within window) | ✅ (any hawker, any past date) | ✅ own customers + covered hawkers' customers on cover dates |
| Bulk "mark all remaining delivered" | ✅ | ✅ own / covered section, within window |
| View customer list / customer calendar | ✅ all | ✅ own customers (+ covered customers while a cover includes today), read-only profile |
| View ₹ reference amounts | ✅ | only if `settings.showAmountToHawkers` |
| Create/edit/deactivate customers, reorder, reassign, rate change | ✅ | ❌ |
| Pauses | ✅ any length, edit/cancel any | ✅ short pause (1–`hawkerMaxPauseDays` days, from today/tomorrow) for own/covered customers; cancel own before it starts |
| Substitutes (leave cover) | ✅ create/shorten/cancel | ❌ (sees "Covering for X" on Today) |
| Hawker management, settings | ✅ | ❌ |
| Master calendar, day register, dashboard, reports, CSV, activity log | ✅ | ❌ (own monthly summary only) |
| Correct entries outside the window | ✅ with reason | ❌ |

---

## 2. Auth — `src/features/auth/`

| Action | Input (Zod) | Output | Notes |
|---|---|---|---|
| `loginAction` | `{ phone: string(10 digits), pin: string(4–8 digits) }` | redirect → `/admin` or `/hawker/today` | Generic error "Wrong phone or PIN". Lock after 5 failures/15 min → `LOCKED`. Updates `lastLoginAt`. Audits failures |
| `logoutAction` | – | redirect `/login` | Deletes the cookie |
| `changeOwnPinAction` | `{ currentPin, newPin, confirmPin }` | `ActionResult` | Increments `sessionVersion`, re-issues own cookie |
| `setLanguageAction` | `{ lang: 'en' \| 'hi' }` | `ActionResult` | Updates the user and the `NEXT_LOCALE` cookie |

Session: JWT (HS256, `jose`) in an httpOnly, Secure, SameSite=Lax cookie `pd_session`; payload `{ userId, role, sv (sessionVersion), exp }`; expiry 30 days (hawker) / 7 days (admin). Secret: `SESSION_SECRET` (≥ 32 chars).

---

## 3. Users (hawkers) — `src/features/users/` (admin only)

| Action / Query | Input | Output |
|---|---|---|
| `listHawkers()` (query) | `{ includeInactive?: boolean }` | `HawkerRow[]` = `{ id, name, phone, active, customerCount, lastLoginAt }` |
| `getHawker(id)` (query) | id | `HawkerDetail` |
| `createHawkerAction` | `{ name, phone, pin }` | `{ id }` (phone unique → `CONFLICT`) |
| `updateHawkerAction` | `{ id, name, phone }` | `{ id }` |
| `resetHawkerPinAction` | `{ id, newPin }` | `ok` (+ `sessionVersion++`) |
| `setHawkerActiveAction` | `{ id, active }` | `ok`. Deactivating requires the hawker to have **0 active customers** (reassign first) → otherwise `CONFLICT` |

---

## 4. Customers — `src/features/customers/`

| Action / Query | Who | Input | Output |
|---|---|---|---|
| `listCustomers(params)` | admin; hawker (forced `hawkerId = self`) | `{ q?, hawkerId?, status?: 'active'\|'inactive'\|'paused'\|'all', page=1, pageSize=25, sort? }` | `{ rows: CustomerRow[], total }` |
| `getCustomer(id)` | admin; hawker if owner | id | `CustomerDetail` (+ current pause, effective rate; rate hidden for hawker unless allowed) |
| `createCustomerAction` | admin | `CustomerInput` = `{ name, phone?, address, area?, notes?, hawkerId, morningQtyMl, eveningQtyMl, ratePaise?, startDate }` | `{ id }`. `routeOrder` = last + 10 |
| `updateCustomerAction` | admin | `{ id, ...CustomerInput }` (hawkerId changes go through reassign) | `{ id }` |
| `reassignCustomerAction` | admin | `{ id, newHawkerId }` | `ok` (appended to the end of the new hawker's route) |
| `deactivateCustomerAction` | admin | `{ id, endDate }` | `ok` |
| `reactivateCustomerAction` | admin | `{ id, startDate }` | `ok` |
| `reorderRouteAction` | admin | `{ hawkerId, orderedCustomerIds: string[] }` | `ok` (rewrites routeOrder 10, 20, 30…) |
| `changeRateAction` | admin | `{ scope: 'default' \| 'customer', customerId?, ratePaise, effectiveFrom: dateKey }` | `{ entriesRepriced: number }`. Updates the setting or customer, and `$set ratePaise` on entries with `dateKey >= effectiveFrom` (for that customer, or for all customers without an override) |

---

## 5. Pauses & Substitutes — `src/features/pauses/`, `src/features/substitutions/`

### Pauses
| Action / Query | Who | Input | Output / Rules |
|---|---|---|---|
| `listPauses({ customerId?, activeOn? })` | admin; hawker (own/covered customers) | | `PauseRow[]` = `{ id, customerId, fromDate, toDate, shift, reason, createdByName, createdByRole, status: 'upcoming'\|'active'\|'ended'\|'cancelled' }` |
| `createPauseAction` | admin | `{ customerId, fromDate, toDate?, shift, reason? }` | `{ id }` (overlap → `CONFLICT`). Audit `pause.create` |
| `createHawkerPauseAction` | hawker | `{ customerId, fromDate, days (1–hawkerMaxPauseDays), shift, reason? }` | `{ id }`. Server checks: access (own/covered on `fromDate`), `fromDate ∈ {today, tomorrow}`, `days ≤ settings.hawkerMaxPauseDays` (else `VALIDATION`), overlap → `CONFLICT`. Computes `toDate`. `createdByRole='hawker'`. Audit `pause.create` |
| `endPauseAction` | admin | `{ id, lastPausedDate }` | `ok` (sets toDate). Audit `pause.end` |
| `cancelPauseAction` | admin (any not-started pause); hawker (own, not started) | `{ id }` | sets `cancelledAt/By`; started pause → `CONFLICT` (use End). Audit `pause.cancel` |

### Substitutes (admin only)
| Action / Query | Input | Output / Rules |
|---|---|---|
| `listSubstitutions({ hawkerId?, status?: 'current'\|'upcoming'\|'past'\|'all' })` | | `SubstitutionRow[]` = `{ id, absentHawker: {id,name}, substituteHawker: {id,name}, fromDate, toDate, note, status }` |
| `getActiveCoversForHawker({ hawkerId, dateKey })` (query, also used by the hawker's Today page for himself) | | `Array<{ absentHawkerId, absentHawkerName, fromDate, toDate }>` |
| `createSubstitutionAction` | `{ absentHawkerId, substituteHawkerId, fromDate, toDate, note? }` | `{ id }`. Rules: plan.md §8 rule 13 (≠, both active, no overlap, no chains, ≤ `MAX_SUBSTITUTION_DAYS`) → `VALIDATION`/`CONFLICT`. Audit `substitution.create` |
| `updateSubstitutionAction` | `{ id, toDate, note? }` | shorten/extend `toDate` (same rules). Audit `substitution.update` |
| `cancelSubstitutionAction` | `{ id }` | only if `fromDate > today`, else `CONFLICT` (shorten instead). Audit `substitution.cancel` |

---

## 6. Deliveries — `src/features/deliveries/` (the core)

| Action / Query | Who | Input | Output / Rules |
|---|---|---|---|
| `getTodaySheet({ dateKey, shift, hawkerId? })` | hawker (self); admin (any hawkerId) | | `{ dateKey, shift, own: SheetSection, covering: Array<SheetSection & { forHawker: { id, name } }> }` where `SheetSection = { progress: { total, done, delivered, notDelivered, pending, totalMl }, todo: SheetRow[], done: SheetRow[], inactive: SheetRow[] }` (`covering` = sections for hawkers he substitutes for on `dateKey`; for admin it shows who covers the selected hawker); `SheetRow = { customerId, name, address, area, defaultQtyMl, state, entry?: { id, status, quantityMl, reason, note, markedAt, markedByName } , pause? }` |
| `markDeliveryAction` | hawker/admin | `{ customerId, dateKey, shift, status, quantityMl?, reason?, note?, correctionReason? }` | Upsert by unique key. Checks: `assertHawkerOwnsCustomer` (own or covered on `dateKey`), `assertDateEditable`, the customer is scheduled or an entry exists (admin may override), delivered → qty>0 & step-aligned, not_delivered → reason. Snapshots: `hawkerId` = the customer's assigned hawker, `markedBy` = session user (the substitute when covering). Returns `{ entry }`. Audit `delivery.mark` (insert) or `delivery.edit` (update, before/after) |
| `unmarkDeliveryAction` | hawker/admin | `{ customerId, dateKey, shift, correctionReason? }` | Deletes the entry (back to "unmarked"). Same checks. Audit `delivery.unmark` with before |
| `markAllRemainingAction` | hawker/admin | `{ dateKey, shift, forHawkerId? }` | `forHawkerId` omitted → the hawker's own customers. A hawker may pass `forHawkerId` only for a hawker he covers on `dateKey` (`assertCanActForHawker`); admin any. Upserts `delivered` with the default qty for every **unmarked** scheduled customer (skips existing entries and paused). Returns `{ count }`. One audit `delivery.bulk_mark` with the count |
| `getCustomerMonth({ customerId, monthKey })` | admin; hawker if owner (or covering today) | | `{ customer, days: Array<{ dateKey, morning: Cell, evening: Cell }>, totals: MonthTotals }` where `Cell = { state, qtyMl, entry? }` |
| `getMasterMonth({ monthKey, hawkerId? })` | admin | | `{ days: Array<{ dateKey, totalMl, delivered, notDelivered, unmarked, paused, covers: string[] }>, totals }` (`covers` = e.g. "Suresh → Ramesh") |
| `getDayRegister({ dateKey, hawkerId?, shift?, state? })` | admin | | `{ rows: Array<{ customer, hawkerName, shift, state, qtyMl, defaultQtyMl, markedByName, markedAt, editCount, reason, note, bySubstitute: boolean }>, summary }` |

`MonthTotals = { daysDelivered, deliveriesCount, notDeliveredCount, unmarkedCount, pausedCount, totalMl, referenceAmountPaise? }` (amount omitted for hawkers unless allowed).

---

## 7. Reports & Dashboard — `src/features/reports/` (admin; hawker summary for self)

| Query | Input | Output |
|---|---|---|
| `getDashboard({ dateKey })` | | `{ today: { morningMl, eveningMl, totalMl }, hawkers: Array<{ id, name, morning: Progress, evening: Progress, coveredBy?: { id, name } }>, unmarkedYesterday: Array<{ customerId, name, hawkerName, shift }>, last30Days: Array<{ dateKey, totalMl }> }` |
| `getMonthlyReport({ monthKey, hawkerId? })` | | `{ customers: Array<{ id, name, hawkerName, ...MonthTotals, ratePaise }>, hawkers: Array<{ id, name, deliveries, totalMl, notDelivered, unmarked }>, days: Array<{ dateKey, totalMl }>, grand: { totalMl, referenceAmountPaise, deliveries } }` |
| `getHawkerMonthSummary({ hawkerId, monthKey })` | hawker self / admin | `{ days: Array<{ dateKey, morningMl, eveningMl, delivered, notDelivered }>, totals }` |
| `buildCustomerSummaryText({ customerId, monthKey, lang })` | admin | `string` for the "Copy summary" button, e.g. `"शर्मा जी — नवंबर 2026\nदूध: 31 दिन, 47.5 लीटर\nदर: ₹60/ली\nकुल (संदर्भ): ₹2,850\n(यह बिल नहीं है)"` |

### Route Handlers
| Method & path | Who | Response |
|---|---|---|
| `GET /api/reports/monthly?month=YYYY-MM&type=customers\|hawkers\|days&hawkerId=` | admin (session cookie) | `text/csv; charset=utf-8` with a **UTF-8 BOM** (so Excel shows Hindi correctly), filename `payonidhi-dairy-customers-2026-11.csv` |
| `GET /api/health` | public | `{ ok: true, db: 'up' \| 'down', time }` |

---

## 8. Settings & Activity — `src/features/settings/`, `src/features/audit/` (admin)

| Action / Query | Input | Output |
|---|---|---|
| `getSettings()` (query, all roles; amount fields filtered for hawker) | | `Settings` |
| `updateSettingsAction` | `{ businessName, hawkerEditDays (0–7), hawkerMaxPauseDays (1–7), showAmountToHawkers, eveningStartsAt }` | ok (rate changes go through `changeRateAction`) |
| `listAuditLogs({ entity?, actorId?, from?, to?, page, pageSize })` | | `{ rows: Array<{ at, actorName, action, summary, before, after, reason }>, total }` |

---

## 9. Pages → data map

| Page (route) | Role | Queries | Actions |
|---|---|---|---|
| `/login` | public | – | `loginAction` |
| `/` | any | – | redirects by role |
| `/hawker/today?date=&shift=` | hawker | `getTodaySheet` (own + covering sections) | `markDeliveryAction`, `unmarkDeliveryAction`, `markAllRemainingAction`, `createHawkerPauseAction`, `cancelPauseAction` |
| `/hawker/customers` | hawker | `listCustomers` | – |
| `/hawker/customers/[id]?month=` | hawker | `getCustomer`, `getCustomerMonth`, `listPauses` | `markDeliveryAction` (window days only), `createHawkerPauseAction`, `cancelPauseAction` |
| `/hawker/summary?month=` | hawker | `getHawkerMonthSummary` | – |
| `/hawker/settings` | hawker | – | `changeOwnPinAction`, `setLanguageAction`, `logoutAction` |
| `/admin` | admin | `getDashboard` | – |
| `/admin/customers` | admin | `listCustomers`, `listHawkers` | deactivate/reactivate |
| `/admin/customers/new`, `/admin/customers/[id]/edit` | admin | `listHawkers`, `getCustomer` | create/update/reassign |
| `/admin/customers/[id]?month=` | admin | `getCustomer`, `getCustomerMonth`, `listPauses` | pauses, `markDeliveryAction` (corrections), `changeRateAction`, copy summary |
| `/admin/customers/[id]/print?month=` | admin | `getCustomer`, `getCustomerMonth` | – (print view) |
| `/admin/hawkers`, `/admin/hawkers/[id]` | admin | `listHawkers`, `getHawker`, `listCustomers({hawkerId})`, `listSubstitutions` | hawker actions, `reorderRouteAction`, substitution actions |
| `/admin/calendar?month=&hawkerId=` | admin | `getMasterMonth` | – |
| `/admin/calendar/[dateKey]` | admin | `getDayRegister` | `markDeliveryAction`, `unmarkDeliveryAction` |
| `/admin/today?hawkerId=&shift=` | admin | `getTodaySheet` | same as hawker (marks on behalf) |
| `/admin/reports?month=` | admin | `getMonthlyReport` | CSV links |
| `/admin/activity` | admin | `listAuditLogs` | – |
| `/admin/settings` | admin | `getSettings` | `updateSettingsAction`, `changeRateAction` (default), change own PIN, language |
