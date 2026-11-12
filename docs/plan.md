# plan.md — Product Plan (WHAT & WHY)

> Status: **v3: one-week MVP scope**. `scope.md` is the active release boundary and supersedes deferred detail below. The broader feature set remains documented for post-MVP work.
> Related: `implementation-plan.md` (how), `design.md` (look), `data-model.md` (data), `api.md` (actions), `testing.md` (checks).

## Active release boundary

The first release must be achievable in 45–65 focused hours. It includes authentication, basic hawker/customer records, delivery marking, audit records, a customer month calendar, and monthly totals. Substitute hawkers, pauses, advanced corrections, CSV/print, PWA work, full Hindi coverage, and the full hardening/pilot program are post-MVP. See `scope.md` for the day-by-day plan.

---

## 1. One-line vision

A simple **digital milk register (दूध का हिसाब)**: every day, each hawker marks on his phone which customers got milk, how many litres, in the morning or evening, and who didn't. The admin sees it all on a calendar, and gets monthly totals.

## 2. Problem today

- Deliveries are tracked on paper or from memory → disputes like "you didn't come on the 12th" or "I took 2 litres, not 1.5".
- The admin can't see live which customers are still left today, or which hawker missed someone.
- At month end, counting days and litres per customer by hand is slow and error-prone.

## 3. Goals (v1)

1. A hawker can finish marking his whole shift in **under 2 minutes** for ~60 customers (pre-filled default qty, one tap per customer, "mark all remaining" button).
2. Every delivery records **who marked it and when** (timestamp), and every edit is logged (who changed what, from → to).
3. The admin can open **any customer's month calendar** and see delivered / not delivered / not marked / paused for each day and shift.
4. Month end: total days and litres per customer, plus a **reference ₹ amount** (litres × rate) that the admin can copy, print or share manually.
5. Works well on cheap Android phones, in **Hindi or English**.

## 4. Non-goals (explicitly OUT of v1)

| Out of scope | Why |
|---|---|
| ❌ Billing, invoices, bill issue/lock | Money is handled between customer and admin outside the app |
| ❌ Online payments, UPI, payment gateway | Same as above |
| ❌ Payment collection tracking, dues, outstanding balance, receipts | Same as above |
| ❌ Customer login / customer portal | Not needed in v1 |
| ❌ WhatsApp / SMS / email automation | Cost, Meta approvals, consent work. Admin can share the summary text manually |
| ❌ Multiple products (curd, paneer…) or milk types | Milk only, one type |
| ❌ Business-wide holidays | Dropped to keep the app small. A day off is handled with pauses, or the hawker marks "not delivered" |
| ❌ Offline mode / sync | Online only in v1 |
| ❌ Route maps / GPS / proof-of-delivery photos | Not requested |
| ❌ Multi-business (SaaS) | One dairy business |
| ❌ Python service | Not needed; the whole app is TypeScript |

> The **reference ₹ amount** is display-only: `litres × rate per litre`. The app never records whether money was paid.

## 5. Users and roles

| Role | Who | Can do | Cannot do |
|---|---|---|---|
| **Admin** (1–2 people) | Owner / manager | Everything: manage hawkers and customers, assign customers to hawkers, set route order, default quantities, rates, pauses (any length), **substitute hawkers for leave**, settings. View every calendar, dashboard, report and activity log. Correct any past entry (reason required) | Mark future dates |
| **Hawker** (3–10) | Delivery person | See **only his assigned customers**. Mark delivered / not delivered and change quantity for **today and yesterday** (configurable). Add a **short pause (up to 3 days, starting today or later)** for his customers when they ask ("no milk tomorrow"). When the admin makes him a **substitute**, he also sees and marks the absent hawker's customers for those dates. View his customers' calendars and his own monthly summary. Change his own PIN and language | Add or edit customers, see other hawkers' customers (except while substituting), make long pauses or edit admin pauses, see ₹ amounts (configurable, default hidden), edit older entries, see reports or settings |

## 6. Key concepts (glossary)

| Term | Meaning |
|---|---|
| **Customer** | A household or shop that gets milk. Has a default morning qty and a default evening qty (0 = no delivery in that shift) |
| **Shift** | `morning` or `evening` |
| **Default quantity** | Litres a customer normally takes per shift (e.g. 1.5 L morning, 0.5 L evening). Pre-filled when marking |
| **Delivery entry** | One record per customer per date per shift: delivered (with actual litres) or not delivered (with reason). Stores who marked it and when |
| **Not marked** | A past scheduled delivery with no entry. Shown in **amber** as a warning. Not the same as "not delivered" |
| **Pause** | A period when a customer doesn't want milk. The **admin** can set any length (e.g. away 10–20 March); a **hawker** can set a short one (1–3 days, `hawkerMaxPauseDays`) for his own customers. Those days are not expected and show grey |
| **Substitute** | Admin-set cover: "Suresh covers Ramesh from 10 to 15 Nov". During those dates Suresh sees Ramesh's customers as an extra section on his Today screen and can mark them. Entries record **Suresh as `markedBy`** (who delivered) and **Ramesh as `hawkerId`** (whose route) |
| **Route order** | The order in which a hawker visits his customers; his Today list follows it |
| **Rate** | ₹ per litre (business default, optional per-customer override). Saved on each entry at marking time so old months don't change when the rate changes |
| **Reference amount** | Σ (litres × rate) for a period. **Display only, not a bill** |
| **Edit window** | How many past days a hawker can still mark or edit (default: today + 1 previous day) |

## 7. Features (v1)

### 7.1 Authentication
- Login with **10-digit Indian mobile number + PIN** (hawker: 4–6 digits; admin: at least 6 digits).
- 5 wrong attempts → account locked for 15 minutes.
- Hawkers stay logged in for 30 days, admins for 7 days.
- Admin can reset a hawker's PIN or deactivate him; this logs him out everywhere immediately.
- The first admin is created with a setup script (no public sign-up).

### 7.2 Hawker: Today screen (the core screen)
- Opens on today's date, on the current shift (morning before 2 PM, evening after; you can switch).
- Header: date, shift toggle, progress (e.g. "32 / 48 done · 51.5 L").
- List of his customers in **route order**. Each card shows: name, short address, default qty, and status.
  - **✓ Delivered**: one tap, saves the default qty.
  - **– / +** stepper: change qty in 0.5 L steps (extra or less milk today).
  - **✗ Not delivered**: bottom sheet with a reason (Customer away / Customer refused / Skip requested / Milk short / Other + note).
  - Tap a marked card to change it (within the edit window).
  - Undo toast for 5 seconds after each tap.
- **"Mark all remaining as delivered"** button (with confirm) for the default-qty case.
- Paused customers appear greyed at the bottom ("Paused till 20 Mar").
- **⋯ menu on a card → "Pause"**: the customer asked for no milk. Pick 1–3 days (starting today or tomorrow) and the shift (both/morning/evening). The hawker can cancel his own pause before it starts.
- **Covering for another hawker**: if the admin made him a substitute for today, a second section "Covering for Ramesh (48)" appears below his own list, with its own progress and "mark all remaining" button.
- A date picker to go back to yesterday (edit window). Future dates are blocked.

### 7.3 Calendars
- **Customer calendar** (hawker: his customers only; admin: all): month grid. Each day shows morning and evening as two small rows with litres and a status colour. Month totals at the bottom (days delivered, litres; ₹ reference for admin only).
- **Admin master calendar**: month grid where each day shows total litres, delivered count, not-delivered count and not-marked count. Can filter by hawker.
- **Day register (admin)**: tap a day → table of every scheduled customer × shift with status, litres, hawker, marked by, marked at, edits. Filter by hawker, status and shift. The admin can correct entries here (reason required → activity log).

### 7.4 Admin: management
- **Hawkers**: add (name, phone, PIN), edit, reset PIN, activate/deactivate, see his customer count.
- **Customers**: data table with search (name, phone, address), filter (hawker, active, paused), add/edit form (name, phone, address, landmark/area, notes, assigned hawker, morning qty, evening qty, start date, optional rate override), deactivate (sets an end date; history is kept).
- **Route order**: for each hawker, reorder customers with up/down buttons (drag on desktop).
- **Reassign**: move a customer to another hawker from a date. Old entries keep the old hawker.
- **Pauses**: add or end a pause for a customer (date range, shift: both/morning/evening, reason).
- **Substitutes (leave cover)**: on a hawker's page → "Add leave / substitute": absent hawker, substitute hawker, from–to dates, note. List of current and upcoming covers; cancel or shorten. No overlapping covers for the same absent hawker, and a substitute can't be absent himself on those dates.
- **Rate change**: change the business default rate or a customer's rate, with "effective from" date (entries from that date are re-priced and the change is logged).
- **Settings**: business name, default rate ₹/L, hawker edit window (days), max hawker pause days (default 3), show ₹ to hawkers (on/off), evening shift switch time.

### 7.5 Admin: dashboard and reports
- **Dashboard (today)**: litres delivered today (morning/evening), progress per hawker (done / not delivered / pending; shows "covered by Suresh" when a substitute is active), list of "not marked yesterday" warnings, 30-day litres chart.
- **Monthly report**:
  - Per customer: days delivered, days not delivered, days paused, total litres, rate, reference ₹.
  - Per hawker: deliveries, litres, not delivered, not marked.
  - Per day: litres.
  - **Export CSV**.
- **Customer monthly summary**: "Copy summary" button (text you can paste into WhatsApp manually) + print-friendly view. Labelled **"Delivery summary, not a bill"**.
- **Activity log**: every create/edit/delete of entries, customers, pauses (admin or hawker), substitutes, rates and settings: who, when, what changed (before → after), and the reason.

### 7.6 Language
- Hindi / English toggle in the header. Saved per user.
- Digits are shown as 0–9 in both languages. Dates are formatted per language.

## 8. Business rules (must be enforced on the server)

1. **One entry per customer per date per shift.** A double tap must not create duplicates.
2. Hawkers can only read or write their **assigned** customers, plus the customers of a hawker they are **substituting for, only on the dates of that cover**.
3. Hawkers can mark **only today and the previous `hawkerEditDays` days** (default 1). Nobody can mark future dates.
4. Admin corrections to an entry **older than the hawker edit window** need a **reason**.
5. **All dates are business dates in IST (Asia/Kolkata).** "Today" means today in IST, whatever the server's timezone.
6. Quantities are stored as **whole millilitres** (1.5 L = 1500), money as **whole paise** (₹60 = 6000). No floats.
7. Each entry stores a **snapshot** of default qty, rate and assigned hawker at marking time, so history never changes silently.
8. **Not delivered** must have a reason. **Delivered** must have qty > 0.
9. If an entry exists on a paused day, the entry wins (e.g. the customer changed their mind and took milk).
10. A deactivated customer or hawker is never hard-deleted (history is kept).
11. Every change to entries, customers, pauses, substitutes, rates or settings writes an **activity log** record.
12. **Hawker pauses**: only for his own (or currently covered) customers, `fromDate` today or tomorrow, length 1 to `hawkerMaxPauseDays` days, `toDate` required, no overlap with an existing pause. He can cancel his own pause only before it starts. The admin can edit or cancel any pause.
13. **Substitutes**: substitute ≠ absent hawker; both active; no overlapping covers for the same absent hawker; a substitute cannot himself be covered by someone else on the same dates (no chains). A cover never changes `customer.hawkerId`.

## 9. Example day (acceptance story)

> Ramesh (hawker) opens the app at 6:10 AM. The Today screen shows 48 customers for the morning. He taps ✓ on 45 of them, changes Sharma ji to 2 L (+0.5 extra), and marks Gupta ji "Not delivered: Customer away". At 7:30 the admin dashboard shows Ramesh 47/48 done, 1 pending. The next morning the dashboard warns "1 not marked yesterday (Ramesh: Verma ji)". Ramesh opens yesterday and marks it. On 1 April the admin opens the March report: Sharma ji shows 31 days, 47.5 L, ₹2,850 (ref.). The admin taps "Copy summary" and sends it to Sharma ji on WhatsApp himself. When Ramesh goes on leave from 10 to 15 April, the admin sets "Suresh covers Ramesh". Those mornings Suresh sees "Covering for Ramesh" under his own list, and Sharma ji's calendar shows "delivered by Suresh (cover)". When Gupta ji tells Ramesh "no milk for 2 days, we're travelling", Ramesh taps ⋯ → Pause → 2 days.

## 10. Acceptance criteria (v1 is "done" when…)

- [ ] Admin can create hawkers and customers, assign customers, set route order, quantities, rates and pauses.
- [ ] A hawker on a phone sees **only** his customers, in route order, and can mark a full shift with one tap per customer.
- [ ] Double taps and retries never create duplicate entries.
- [ ] Hawkers cannot mark future dates or dates outside the edit window. This is checked on the **server**.
- [ ] Every entry shows who marked it and when; every edit appears in the activity log with before/after.
- [ ] The customer calendar correctly shows delivered / not delivered / not marked / paused / future for both shifts.
- [ ] A hawker can add a 1–3 day pause from his phone; anything longer or in the past is rejected by the server.
- [ ] When a substitute is set, the covering hawker sees and marks the absent hawker's customers only on those dates; entries show who delivered and whose route it was.
- [ ] The monthly report totals match a hand-calculated sample month exactly (litres and reference ₹).
- [ ] CSV export opens correctly in Excel/Google Sheets (Hindi names readable).
- [ ] The whole app works in Hindi and English.
- [ ] Usable on a 360 px wide Android phone; touch targets ≥ 48 px.
- [ ] Deployed online with HTTPS, a backup plan, and setup steps documented in the README.

## 11. What we took from each original plan

| Idea | From | Kept? |
|---|---|---|
| Next.js + TypeScript + Tailwind + shadcn/ui + MongoDB/Mongoose | Both | ✅ |
| TanStack Table for admin tables, Recharts for charts | Your plan | ✅ (admin only) |
| Zod validation, central role checks, server-side authorization | Both | ✅ |
| Money as integers, UTC timestamps + business timezone, audit log, no hard deletes | Your plan | ✅ (money only for the reference amount) |
| Hawker role, daily delivery confirmation, delivered/skipped/failed + reason, unique per customer/date | Friend's plan | ✅ simplified to delivered / not delivered |
| Customer pause | Friend's plan | ✅ simplified (+ short hawker pauses) |
| Holidays | Friend's plan | ❌ dropped (your choice) |
| Substitute hawker for leave | New (your request) | ✅ |
| Snapshots of price/qty on each delivery | Both | ✅ |
| Seed data, staging/preview, backups, deploy on Vercel | Both | ✅ Vercel **Hobby** + GitHub auto-deploys |
| Charges, collections, invoices, payments, adjustments, outstanding | Both | ❌ removed (your instruction) |
| Customer portal, WhatsApp, notification consent | Friend's plan | ❌ deferred |
| Generic "services/orders/properties" model | Your plan | ❌ replaced by milk-specific customer + delivery entry |
| `businessId` multi-tenant field | Friend's plan | ❌ single business (simpler) |
| Background job queue | Friend's plan | ❌ not needed (nothing is generated in batches; "expected" deliveries are calculated when needed) |

## 12. Decisions from Q&A (resolved)

| Question | Decision |
|---|---|
| Users | Admin + multiple hawkers, no customer login |
| Product | Milk only, litres |
| Money | Reference ₹ only (litres × rate), never payments |
| Login | Phone + PIN |
| Marking | Default qty pre-filled; one tap |
| Shifts | Morning + evening |
| Language | Hindi + English toggle |
| Customer edits | Admin only |
| Pauses | Admin: any length. Hawker: 1–3 days for his customers |
| Leave cover | Substitute hawker feature in v1 |
| Holidays | Dropped |
| Qty step | 0.5 L |
| Connectivity | Online only |
| Scale | 150–600 customers, 3–10 hawkers |
| App name | **Payonidhi Dairy** (पयोनिधि डेयरी) |
| Hosting | **Vercel Hobby** (free) + **MongoDB Atlas M0** (free), code on **GitHub** → auto-deploy on every push |
| Framework | **Next.js** (App Router) + TypeScript, one app for frontend + backend |

## 13. Still open (defaults are used unless you change them)

1. **Show ₹ to hawkers?** Default: hidden.
2. **Evening switch time**: default 2 PM.
3. **Hawker edit window**: default today + yesterday.
4. **Vercel Hobby terms**: Vercel's Hobby plan is meant for personal/non-commercial use. It's fine for building and piloting. If Vercel ever flags it, or the business grows, move to Pro or a small VPS (the code doesn't change).
