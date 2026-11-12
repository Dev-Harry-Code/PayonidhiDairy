# data-model.md — Database Design (MongoDB + Mongoose)

> **MVP boundary:** Implement only the models and fields needed for users, customers, delivery entries, settings, and audit logs first. Pause and substitution models remain documented for post-MVP.

> Source of truth for collections, fields, indexes and the core delivery logic. Models live in `src/models/`. Pure logic lives in `src/features/deliveries/expected.ts`.
> Related: `plan.md` §6–8 (rules), `api.md` (who reads/writes what).

---

## 0. Conventions

| Convention | Rule |
|---|---|
| Business date | `dateKey: string` in format `YYYY-MM-DD`, **always in IST (Asia/Kolkata)**. Never store business dates as JS `Date` |
| Month | `monthKey: string` in format `YYYY-MM` |
| Timestamps | Real moments (markedAt, createdAt) are stored as `Date` (UTC), shown in IST |
| Quantity | `...Ml: number`, an **integer** of millilitres (1.5 L → `1500`). Allowed step: **500 ml** (constant `QTY_STEP_ML`; change in one place if needed later) |
| Money | `...Paise: number`, an **integer** of paise (₹60/L → `6000`) |
| Amount maths | `amountPaise = Math.round(quantityMl * ratePaise / 1000)` |
| Phone | Normalised to 10 digits (`9876543210`), no +91, no spaces. Validated with regex `^[6-9]\d{9}$` |
| IDs | MongoDB `ObjectId`; sent to the client as strings |
| Deletion | Never hard-delete users, customers or entries that have history. Use `active=false` / `endDate`. Exceptions: cancelling a pause that has not started, cancelling a future substitute cover, and unmarking an entry within the window (logged) |
| Timestamps option | All schemas use `{ timestamps: true }` → `createdAt`, `updatedAt` |

Shared enums (in `src/lib/constants.ts`):
```ts
export const ROLES = ['admin', 'hawker'] as const;
export const SHIFTS = ['morning', 'evening'] as const;
export const SHIFT_SCOPES = ['both', 'morning', 'evening'] as const;
export const DELIVERY_STATUSES = ['delivered', 'not_delivered'] as const;
export const NOT_DELIVERED_REASONS = ['customer_away', 'customer_refused', 'skip_requested', 'stock_short', 'other'] as const;
export const QTY_STEP_ML = 500;
export const MAX_QTY_ML = 20000; // 20 L safety cap per shift
export const BUSINESS_TZ = 'Asia/Kolkata';
export const MAX_SUBSTITUTION_DAYS = 31; // safety cap per cover
```

---

## 1. `users`

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `name` | string | required, 2–60 chars |
| `phone` | string | required, **unique**, normalised 10 digits |
| `pinHash` | string | required, bcrypt hash (never returned to the client) |
| `role` | `'admin' \| 'hawker'` | required |
| `active` | boolean | default `true` |
| `preferredLanguage` | `'en' \| 'hi'` | default `'hi'` for hawkers, `'en'` for admin |
| `sessionVersion` | number | default `1`; incremented on PIN reset / deactivation → kills old sessions |
| `failedLoginCount` | number | default `0` |
| `lockedUntil` | Date \| null | set for 15 min after 5 failures |
| `lastLoginAt` | Date \| null | |
| `createdAt`, `updatedAt` | Date | |

Indexes: `{ phone: 1 }` unique · `{ role: 1, active: 1 }`

---

## 2. `customers`

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `name` | string | required, 2–80 chars (Hindi allowed) |
| `phone` | string \| null | optional, normalised; **not unique** (families share phones) |
| `address` | string | required, max 200 |
| `area` | string \| null | locality/landmark, max 80 (used for filters) |
| `notes` | string \| null | max 300 (e.g. "ring bell twice") |
| `hawkerId` | ObjectId → users | required, must be an active hawker |
| `routeOrder` | number | integer; sort order within the hawker's list (gaps allowed: 10, 20, 30…) |
| `morningQtyMl` | number | integer ≥ 0, multiple of `QTY_STEP_ML`; 0 = no morning delivery |
| `eveningQtyMl` | number | same; 0 = no evening delivery. At least one of morning/evening must be > 0 |
| `ratePaise` | number \| null | null → use `settings.defaultRatePaise` |
| `startDate` | dateKey | required; no delivery expected before it |
| `endDate` | dateKey \| null | set on deactivation; no delivery expected after it |
| `active` | boolean | default `true` |
| `createdBy` | ObjectId → users | |
| `createdAt`, `updatedAt` | Date | |

Indexes: `{ hawkerId: 1, active: 1, routeOrder: 1 }` (Today screen) · `{ active: 1, name: 1 }` · text index on `{ name: 'text', address: 'text', area: 'text', phone: 'text' }` (or regex search for small data)

> **Reassignment**: changing `hawkerId` affects only future/unmarked days. Existing entries keep their `hawkerId` snapshot.

---

## 3. `deliveryentries` (model `DeliveryEntry`) — the heart of the app

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `customerId` | ObjectId → customers | required |
| `dateKey` | string `YYYY-MM-DD` | required, IST business date |
| `shift` | `'morning' \| 'evening'` | required |
| `status` | `'delivered' \| 'not_delivered'` | required |
| `quantityMl` | number | integer; `> 0` if delivered, `0` if not delivered |
| `reason` | enum `NOT_DELIVERED_REASONS` \| null | required if not_delivered, else null |
| `note` | string \| null | max 200; required if reason = `other` |
| `defaultQtyMl` | number | **snapshot** of the customer's default for that shift at first marking |
| `ratePaise` | number | **snapshot** of the effective rate at first marking (can be updated by an admin rate change "effective from") |
| `hawkerId` | ObjectId → users | **snapshot** of the assigned hawker at marking time ("whose route") |
| `markedBy` | ObjectId → users | the user who first marked it ("who delivered/recorded") |
| `markedAt` | Date | when it was first marked ("when it was delivered") |
| `updatedBy` | ObjectId \| null | last editor |
| `editCount` | number | default 0, incremented on each change |
| `createdAt`, `updatedAt` | Date | |

Indexes:
- `{ customerId: 1, dateKey: 1, shift: 1 }` **unique**: no duplicates; makes upsert idempotent
- `{ dateKey: 1, hawkerId: 1, shift: 1 }`: Today screen, dashboard, day register
- `{ customerId: 1, dateKey: 1 }`: customer month calendar (range query on dateKey string works because of the fixed format)
- `{ dateKey: 1 }`: monthly report range scans

Write pattern: `findOneAndUpdate({customerId, dateKey, shift}, {...}, { upsert: true, new: true })`. On insert, set `markedBy`/`markedAt`/snapshots with `$setOnInsert`. On update, set `updatedBy`, `$inc: { editCount: 1 }`, and write an AuditLog record with before/after.

Growth estimate: 600 customers × ~1.3 shifts × 365 days ≈ **285k docs/year**, ≈ 100–150 MB/year including indexes → fits the Atlas free tier (512 MB) for ~2–3 years; upgrade later.

---

## 4. `customerpauses` (model `CustomerPause`)

| Field | Type | Rules |
|---|---|---|
| `customerId` | ObjectId | required |
| `fromDate` | dateKey | required |
| `toDate` | dateKey \| null | inclusive; null = "until resumed" |
| `shift` | `'both' \| 'morning' \| 'evening'` | default `both` |
| `reason` | string \| null | max 120 |
| `createdBy` | ObjectId | |
| `createdByRole` | `'admin' \| 'hawker'` | who made it (hawker pauses are shown with a "by hawker" tag) |
| `endedAt`, `endedBy` | Date, ObjectId \| null | when "End pause" sets `toDate` = yesterday/today |
| `cancelledAt`, `cancelledBy` | Date, ObjectId \| null | a pause cancelled before it started (kept for history, ignored by the logic) |

Indexes: `{ customerId: 1, fromDate: 1 }`. Validation: `toDate >= fromDate`; active (not cancelled) pauses for the same customer must not overlap on a shared shift.

**Hawker pause rules** (checked in the action, see `plan.md` §8 rule 12): the customer is his (or he covers its hawker today); `fromDate ∈ {today, tomorrow}`; `toDate` required; `diffDays(toDate, fromDate) + 1 ≤ settings.hawkerMaxPauseDays`; he can cancel only his own pause and only while `fromDate > today`.

---

## 5. `substitutions` (model `Substitution`): leave cover

| Field | Type | Rules |
|---|---|---|
| `absentHawkerId` | ObjectId → users | required, active hawker |
| `substituteHawkerId` | ObjectId → users | required, active hawker, ≠ absent |
| `fromDate` | dateKey | required |
| `toDate` | dateKey | required, `>= fromDate`, at most `MAX_SUBSTITUTION_DAYS` long |
| `note` | string \| null | max 120 (e.g. "Ramesh: village wedding") |
| `createdBy` | ObjectId | admin |
| `cancelledAt`, `cancelledBy` | Date, ObjectId \| null | cancelled covers are ignored by the logic |

Indexes: `{ substituteHawkerId: 1, fromDate: 1, toDate: 1 }` (Today screen) · `{ absentHawkerId: 1, fromDate: 1 }`.
Validation (in the service): no overlapping active covers for the same `absentHawkerId`; the substitute must not be an `absentHawkerId` in an overlapping active cover (no chains); the absent hawker must not be a substitute in an overlapping cover.
Shorten = set an earlier `toDate` (not before today unless the admin confirms). Cancel = only for covers that haven't started; started covers are shortened instead.

> A cover **never changes `customer.hawkerId`**. Entries marked by the substitute get `hawkerId` = the absent hawker (whose route) and `markedBy` = the substitute (who delivered).

---

## 6. `settings` (model `Settings`) — single document (`key: 'app'`)

| Field | Type | Default |
|---|---|---|
| `key` | `'app'` | unique |
| `businessName` | string | `"Payonidhi Dairy"` |
| `defaultRatePaise` | number | `6000` (₹60/L) |
| `hawkerEditDays` | number 0–7 | `1` (today + yesterday) |
| `hawkerMaxPauseDays` | number 1–7 | `3` |
| `showAmountToHawkers` | boolean | `false` |
| `eveningStartsAt` | `"HH:mm"` | `"14:00"` (default shift on the Today screen) |
| `updatedBy` | ObjectId | |

Accessed through `getSettings()`, which creates the default document if it is missing (cached per request).

---

## 7. `auditlogs` (model `AuditLog`) — append-only

| Field | Type | Rules |
|---|---|---|
| `actorId` | ObjectId | |
| `actorRole` | role | |
| `action` | string | e.g. `delivery.mark`, `delivery.edit`, `delivery.unmark`, `delivery.bulk_mark`, `delivery.admin_correct`, `customer.create`, `customer.update`, `customer.reassign`, `customer.deactivate`, `customer.rate_change`, `pause.create`, `pause.end`, `pause.cancel`, `substitution.create`, `substitution.update`, `substitution.cancel`, `user.create`, `user.update`, `user.reset_pin`, `user.deactivate`, `settings.update`, `auth.login_failed`, `auth.locked` |
| `entity` | string | `DeliveryEntry`, `Customer`, `User`, … |
| `entityId` | ObjectId \| null | |
| `summary` | string | short human text, e.g. "Sharma ji 12 Mar morning: 1.5 L → 2 L" |
| `before` | object \| null | only the changed fields |
| `after` | object \| null | only the changed fields |
| `reason` | string \| null | required for admin corrections outside the window |
| `at` | Date | default now |

Indexes: `{ at: -1 }` · `{ entity: 1, entityId: 1, at: -1 }` · `{ actorId: 1, at: -1 }`. Never update or delete.

---

## 8. Core logic: "expected delivery" and calendar cell state

Pure functions, no DB access, unit-tested. File: `src/features/deliveries/expected.ts`.

```ts
type CellState =
  | 'delivered' | 'not_delivered'   // an entry exists
  | 'unmarked'                      // scheduled, in the past/today, no entry (amber warning)
  | 'paused'                        // not expected
  | 'not_scheduled'                 // customer not active that day, or qty 0 for that shift
  | 'future';                       // scheduled, date > today (show planned qty faintly)

function scheduledQtyMl(customer, shift): number
  // shift === 'morning' ? customer.morningQtyMl : customer.eveningQtyMl

function isActiveOn(customer, dateKey): boolean
  // dateKey >= customer.startDate && (!customer.endDate || dateKey <= customer.endDate)

function pauseCovers(pauses, customerId, dateKey, shift): Pause | undefined
  // !p.cancelledAt && p.customerId === id && dateKey >= p.fromDate && (!p.toDate || dateKey <= p.toDate)
  //   && (p.shift === 'both' || p.shift === shift)

function resolveCell({ customer, dateKey, shift, entry, pauses, todayKey }): { state: CellState; qtyMl: number; entry?: Entry }
  1. if entry → state = entry.status, qtyMl = entry.quantityMl        // entry always wins
  2. if !isActiveOn(customer, dateKey) or scheduledQtyMl(customer, shift) === 0 → 'not_scheduled'
  3. if pauseCovers(...) → 'paused'
  4. if dateKey > todayKey → 'future', qtyMl = scheduledQtyMl
  5. else → 'unmarked', qtyMl = scheduledQtyMl

function isExpected(...) = resolveCell(...) without entry ∈ {'unmarked','future'}   // used for counts
```

### Access logic (substitutes): `src/features/substitutions/coverage.ts` (pure)
```ts
function activeCoversFor(substitutions, substituteHawkerId, dateKey): Substitution[]
  // !s.cancelledAt && s.substituteHawkerId === id && s.fromDate <= dateKey && dateKey <= s.toDate

function coveredHawkerIds(substitutions, substituteHawkerId, dateKey): string[]
  // activeCoversFor(...).map(s => s.absentHawkerId)

function canHawkerAccessCustomer({ hawkerId, customer, dateKey, substitutions }): boolean
  // customer.hawkerId === hawkerId || coveredHawkerIds(substitutions, hawkerId, dateKey).includes(customer.hawkerId)
```
`assertHawkerOwnsCustomer` in the DAL uses `canHawkerAccessCustomer` with the **date being marked**, so a substitute can only touch the absent hawker's customers on cover dates (still limited by the edit window). Customer calendar pages are viewable by a substitute only while a cover includes **today**.

> Note: for past unmarked days we use the customer's **current** default qty (good enough; the entry snapshot is what really counts).

### Hawker Today list query
1. `customers.find({ hawkerId, active: true }).sort({ routeOrder: 1 })` (plus customers whose `endDate >= dateKey`, for yesterday views)
2. `deliveryentries.find({ dateKey, shift, customerId: { $in: ids } })`
3. pauses for those customers covering `dateKey`
4. `resolveCell` for each → split into **To do** (unmarked), **Done** (delivered/not_delivered), **Paused** (bottom).
5. **Substitute sections**: `coveredHawkerIds(subs, hawkerId, dateKey)` → for each covered hawker, repeat steps 1–4 with his customers and return them as an extra section `{ forHawker: { id, name }, progress, todo, done, inactive }`.

### Monthly totals (per customer)
- `daysDelivered` = number of distinct `dateKey`s with ≥ 1 delivered entry
- `deliveriesCount` = number of delivered entries (morning + evening counted separately)
- `notDeliveredCount`, `unmarkedCount`, `pausedCount` (computed via `resolveCell` over the month)
- `totalMl` = Σ `quantityMl` of delivered entries
- `referenceAmountPaise` = Σ `round(quantityMl × ratePaise / 1000)` per entry (sum of per-entry rounded amounts)

Use a MongoDB aggregation for the entry sums; use `resolveCell` for the counts of unmarked/paused (these need customers + pauses).

---

## 9. Example documents

```json
// customer
{ "_id": "66f…a1", "name": "शर्मा जी", "phone": "9876543210", "address": "12, Shastri Nagar", "area": "Shastri Nagar",
  "hawkerId": "66f…h1", "routeOrder": 30, "morningQtyMl": 1500, "eveningQtyMl": 500, "ratePaise": null,
  "startDate": "2026-11-01", "endDate": null, "active": true }

// delivery entry
{ "customerId": "66f…a1", "dateKey": "2026-11-12", "shift": "morning", "status": "delivered", "quantityMl": 2000,
  "reason": null, "note": null, "defaultQtyMl": 1500, "ratePaise": 6000, "hawkerId": "66f…h1",
  "markedBy": "66f…h1", "markedAt": "2026-11-12T00:41:10Z", "updatedBy": null, "editCount": 0 }
```
