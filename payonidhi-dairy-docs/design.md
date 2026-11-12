# design.md — UI / UX Design

> **MVP boundary:** Design the login, role shells, basic records, Today screen, customer month calendar, and monthly totals first. Defer polish-heavy screens and full responsive/accessibility passes until after the one-week MVP.

> How the app looks and behaves. Built with **Tailwind CSS + shadcn/ui** (components copied into `src/components/ui`). Icons: **lucide-react**.
> Related: `plan.md` §7 (features), `api.md` §9 (pages → data).

---

## 1. Design principles

1. **Hawker first, thumb first.** The hawker uses the app with one hand, outdoors, in a hurry, often in sunlight. Big targets, high contrast, minimal typing.
2. **One tap = one delivery.** The default qty is pre-filled; typing is never needed for the normal case.
3. **Status = colour + icon + text.** Never colour alone (colour-blind users, glare).
4. **Hindi-ready.** Every label comes from translation files; layouts allow 30% longer text; Devanagari font loaded.
5. **Calm admin, dense when needed.** Cards on mobile, tables on desktop (≥ 768 px).
6. **Never lose work silently.** Every save shows feedback (toast). Errors explain what to do ("No internet, tap to retry").

---

## 2. Design tokens

Defined as CSS variables in `src/app/globals.css` (shadcn theme format, Tailwind v4 `@theme`). Light mode only in v1.

### Colours
| Token | Value | Use |
|---|---|---|
| `--primary` | `#1E40AF` (blue-800) | Primary buttons, active nav, links |
| `--primary-foreground` | `#FFFFFF` | |
| `--background` | `#F8FAFC` (slate-50) | App background |
| `--card` | `#FFFFFF` | Cards, sheets |
| `--foreground` | `#0F172A` (slate-900) | Body text |
| `--muted-foreground` | `#475569` (slate-600) | Secondary text (keep contrast ≥ 4.5:1) |
| `--border` | `#E2E8F0` | |
| `--destructive` | `#DC2626` | Destructive actions |

### Delivery status colours (`src/lib/status-styles.ts`, single source)
| State | Background | Text/Border | Icon (lucide) | Label EN / HI |
|---|---|---|---|---|
| `delivered` | `#DCFCE7` green-100 | `#15803D` green-700 | `Check` | Delivered / दिया |
| `not_delivered` | `#FEE2E2` red-100 | `#B91C1C` red-700 | `X` | Not delivered / नहीं दिया |
| `unmarked` | `#FEF3C7` amber-100 | `#B45309` amber-700 | `AlertCircle` | Not marked / दर्ज नहीं |
| `paused` | `#F1F5F9` slate-100 | `#64748B` slate-500 | `PauseCircle` | Paused / रोका गया |
| `future` | transparent, dashed border | `#94A3B8` slate-400 | – | Planned / तय |
| `not_scheduled` | transparent | `#CBD5E1` | – | – |
| qty ≠ default | small dot `#1E40AF` in the corner | | | Changed qty / मात्रा बदली |

### Typography
- Fonts via `next/font/google`: **Inter** (Latin) + **Noto Sans Devanagari** (Hindi). CSS: `font-family: var(--font-inter), var(--font-devanagari), system-ui, sans-serif`.
- Scale: body 16 px; hawker customer name 18 px semibold; page title 20 px (mobile) / 24 px (desktop); numbers in progress and totals 24–28 px bold, `tabular-nums`.
- Line height ≥ 1.5 for Devanagari (matras need space).

### Spacing, shape, motion
- 4 px grid. Card padding 16 px. Gap between hawker cards 8 px.
- Radius: 12 px cards, 10 px buttons, full for pills.
- **Touch targets ≥ 48 × 48 px** (hawker action buttons 56 px high).
- Motion: 150 ms ease-out; respect `prefers-reduced-motion`.

### Formatting helpers (`src/lib/units.ts`, `src/lib/dates.ts`)
- Litres: `1500 → "1.5 L"` / `"1.5 ली"`; `2000 → "2 L"`; `500 → "0.5 L"`.
- Money: `285000 paise → "₹2,850"` (Indian grouping `en-IN`: ₹1,25,000).
- Dates: EN `"Thu, 12 Nov"`, HI `"गुरु, 12 नव॰"`; month `"November 2026"` / `"नवंबर 2026"`.
- Time: `"6:42 AM"` (IST).

---

## 3. Layouts & navigation

### Hawker shell (mobile only, `src/app/hawker/layout.tsx`)
```
┌──────────────────────────────┐
│ Payonidhi Dairy        [हि|EN] (R) │  ← top bar: business name, language toggle, avatar initial
├──────────────────────────────┤
│                              │
│         page content         │
│                              │
├──────────────────────────────┤
│  ☀ Today  👥 Customers  📊 Summary  ⚙ │  ← bottom tab bar, 64 px, safe-area padding
└──────────────────────────────┘
```
(Icons: `Sun`, `Users`, `BarChart3`, `Settings`.)

### Admin shell (`src/app/admin/layout.tsx`)
- **Desktop ≥ 1024 px**: left sidebar (240 px) with Dashboard, Today sheets, Calendar, Customers, Hawkers (incl. leave & cover), Reports, Activity, Settings. Top bar with business name, language toggle, user menu.
- **Mobile**: top bar + hamburger → `Sheet` with the same nav; the 4 most-used items also appear in a bottom bar (Dashboard, Calendar, Customers, More).

---

## 4. Screens (wireframes)

### 4.1 Login `/login`
```
┌──────────────────────────────┐
│          🥛 Payonidhi Dairy          │
│   दूध का हिसाब, आसान          │
│                              │
│  Mobile number               │
│  ┌──────────────────────────┐│
│  │ +91 │ 98765 43210        ││  inputMode="numeric", maxLength 10
│  └──────────────────────────┘│
│  PIN                         │
│  ┌──────────────────────────┐│
│  │ ● ● ● ●              👁  ││  inputMode="numeric", type=password
│  └──────────────────────────┘│
│  [        Login         ]    │  56 px primary
│                   हिंदी | EN  │
└──────────────────────────────┘
```
Errors are inline under the form: "Wrong mobile number or PIN" / "Too many attempts. Try after 15 minutes."

### 4.2 Hawker: Today `/hawker/today` ⭐ most important
```
┌──────────────────────────────┐
│ ‹  Thu, 12 Nov  ›   [📅]     │  ← prev/next day (next disabled at today), date picker limited to window
│ ┌─────────┬─────────┐        │
│ │☀ Morning│🌙 Evening│        │  ← segmented toggle
│ └─────────┴─────────┘        │
│ ███████████░░░░  32/48 done   │  ← progress bar
│ 51.5 L delivered · 2 ✗ · 14 left│
├──────────────────────────────┤
│ TO DO (14)                   │
│ ┌──────────────────────────┐ │
│ │ 30  Sharma ji          ⋯  │ │  ← route number + name (18 px); ⋯ menu = Pause / Call / Open calendar
│ │     12, Shastri Nagar     │ │
│ │ [ – ]  1.5 L  [ + ]       │ │  ← stepper (48 px buttons)
│ │ [ ✗ Not given ][✓ Delivered]│ │  ← 56 px, ✓ is the larger primary green button (right, thumb side)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 40  Gupta ji   …          │ │
│ └──────────────────────────┘ │
│                              │
│ DONE (34)              ▾     │  ← collapsible
│ ┌──────────────────────────┐ │
│ │ ✓ Verma ji   2 L • 6:42 AM│ │  ← compact row, green-tint; dot if qty ≠ default; tap → edit sheet
│ │ ✗ Jain ji  Customer away  │ │  ← red-tint
│ └──────────────────────────┘ │
│ PAUSED (2)              ▾    │
│ │ ‖ Mehta ji  till 20 Nov   │ │  ← grey; "by you" tag + [Cancel] if it's the hawker's own not-started pause
├──────────────────────────────┤
│ 🔁 COVERING FOR RAMESH (48)  │  ← only when the admin set a cover for today; own colour band (indigo-50)
│ ████░░░░░░ 10/48 · 15 L      │  ← its own progress
│ TO DO / DONE / PAUSED …      │  ← same cards as above
│ [ ✓ Mark all 38 of Ramesh's remaining ] │
├──────────────────────────────┤
│ [ ✓ Mark all 14 remaining delivered ] │ ← sticky above the tab bar, opens confirm dialog
└──────────────────────────────┘
```
Behaviour:
- Tap ✓ → the card animates into DONE, toast "Sharma ji: 1.5 L ✓ [Undo]" (5 s). Optimistic UI with `useOptimistic`; on failure, roll back + error toast with Retry.
- Buttons are disabled while their own request is pending (prevents double submit; the server is idempotent anyway).
- Not given → **Bottom Sheet (shadcn `Drawer`)**: radio list of reasons (large rows) + optional note (required for "Other") + [Save].
- Tap a DONE row → edit sheet: status toggle, stepper, reason, [Save] [Remove mark].
- **⋯ → Pause** → **Hawker pause sheet** (Drawer): "No milk for" chips **[1 day] [2 days] [3 days]** (max = `hawkerMaxPauseDays`), "Starting" **[Today] [Tomorrow]**, shift **[Both] [Morning] [Evening]**, optional reason, [Save]. Shows "Paused till Sat, 14 Nov" after saving. Longer pauses → hint "Ask admin for longer pauses".
- **Covering section**: collapsible, starts expanded; the header says whose route it is and the cover dates ("till 15 Nov"). Marking works exactly like the own list; entries show "by you (cover)" in the day details.
- Outside the edit window (should not normally be reachable) → read-only banner.
- Empty state: "No customers assigned. Contact admin."

### 4.3 Hawker: Customers `/hawker/customers`
Search box + list (route order): name, area, "1.5 L ☀ · 0.5 L 🌙", a pause badge. Tap → customer calendar.

### 4.4 Customer month calendar (shared component `<CustomerMonthCalendar>`)
Used at `/hawker/customers/[id]` and `/admin/customers/[id]`.
```
┌──────────────────────────────┐
│ Sharma ji          📞 Call    │
│ 12, Shastri Nagar · Ramesh    │
│ Default: ☀ 1.5 L  🌙 0.5 L    │
│ ‹   November 2026    ›        │
│ Mo  Tu  We  Th  Fr  Sa  Su    │
│ ┌───┬───┬───┬───┬───┬───┬───┐ │
│ │ 1 │ 2 │ 3 │...│   │   │   │ │
│ │1.5│1.5│ ✗ │   │   │   │   │ │  ← top half = morning cell (colour + qty/icon)
│ │.5 │.5 │.5 │   │   │   │   │ │  ← bottom half = evening cell
│ └───┴───┴───┴───┴───┴───┴───┘ │
│ Legend: ✓ Delivered ✗ Not given ! Not marked ‖ Paused       │
├──────────────────────────────┤
│ This month                   │
│ Days: 28 · Deliveries: 54     │
│ Litres: 47.5 L                │
│ Not given: 2 · Not marked: 1  │
│ Reference: ₹2,850 (not a bill)│  ← admin only (or if allowed)
│ [📋 Copy summary] [🖨 Print]  │  ← admin only
└──────────────────────────────┘
```
- Cell min size 44 × 52 px on a 360 px screen (7 columns × 44 = 308 px + gaps).
- Tap a day → **Day detail sheet**: morning and evening rows with status, qty, marked by, time, edit count; edit controls if editable (hawker: window; admin: always, with a reason field when outside the window).
- Hawker view: a **[‖ Pause]** button in the header opens the `HawkerPauseSheet` (1–3 days); upcoming pauses are listed under the calendar with [Cancel] for his own.
- Today's cell has a primary ring. Future cells show the planned qty faintly.

### 4.5 Hawker: Summary `/hawker/summary`
Month picker; big numbers (total litres, deliveries, not given, not marked); a list of days with ☀ L / 🌙 L. No ₹ unless allowed.

### 4.6 Hawker: Settings `/hawker/settings`
Language (big toggle), Change PIN form, Logout (with confirm). The app version is shown at the bottom.

### 4.7 Admin: Dashboard `/admin`
```
Desktop grid:
┌────────────┬────────────┬────────────┬────────────┐
│ Today total│ Morning    │ Evening    │ Not marked │
│ 412.5 L    │ 300 L      │ 112.5 L    │ yesterday: 3│  ← stat cards
└────────────┴────────────┴────────────┴────────────┘
┌───────────────────────────────┬─────────────────────┐
│ Hawker progress (today)        │ ⚠ Not marked yesterday │
│ Ramesh  ☀ ████████░ 47/48      │ Verma ji · Ramesh ☀  │
│         🌙 ░░░░░░░░ 0/12       │ …  [Open day →]       │
│ Suresh  ☀ ██████████ 60/60 ✓   │                     │
└───────────────────────────────┴─────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Litres per day, last 30 days (Recharts bar chart)     │
└──────────────────────────────────────────────────────┘
```
Mobile: the same blocks stacked. Each hawker row links to `/admin/today?hawkerId=`.

### 4.8 Admin: Customers `/admin/customers`
- Desktop: **TanStack data table** (shadcn data-table pattern): columns #route, Name, Phone, Area, Hawker, ☀ qty, 🌙 qty, Rate, Status (Active/Paused/Inactive badge), actions (⋯ View, Edit, Pause, Deactivate). Search, hawker filter, status filter, pagination 25, column sort.
- Mobile: card list with the same data + filter sheet.
- [+ Add customer] → `/admin/customers/new`.

### 4.9 Admin: Customer form (new / edit)
Single column, sections: **Details** (name, phone, address, area, notes) · **Delivery** (hawker select, morning qty stepper, evening qty stepper, start date) · **Rate** (use default ₹60/L ☑ or custom). Inline Zod errors. Sticky [Save] on mobile.

### 4.10 Admin: Customer detail `/admin/customers/[id]`
Header card (details, hawker, defaults, rate, status, [Edit] [Reassign] [Pause] [Deactivate]) + tabs: **Calendar** (4.4 component) · **Pauses** (list with "by admin / by hawker" tag + add/end/cancel) · **Activity** (audit logs for this customer).

### 4.11 Admin: Hawkers `/admin/hawkers`, `/admin/hawkers/[id]`
List: name, phone, active badge, customers count, last login. Detail: edit, reset PIN, (de)activate, and **Route order** list: each row `[↑][↓] 30 Sharma ji – Shastri Nagar` (dnd-kit drag handle on desktop) + [Save order].

**Leave & cover** card on the hawker detail page (and a "Current covers" strip at the top of `/admin/hawkers`):
```
┌ Leave & cover ───────────────────────────────┐
│ 🔁 Suresh covers Ramesh · 10–15 Nov · active   [Shorten] │
│ 🔁 Mahesh covers Ramesh · 2–4 Dec · upcoming  [Cancel]  │
│ [+ Add leave / substitute]                              │
└──────────────────────────────────────────────┘
```
**SubstitutionDialog**: absent hawker (prefilled), substitute (select, active hawkers except him), from/to dates, note → validation messages for overlap/chain.

### 4.12 Admin: Master calendar `/admin/calendar`
Hawker filter (All / name). Month grid; each day cell: total litres (bold), `✓ 410 ✗ 4 ! 2`, a small 🔁 tag on days with an active cover (tooltip "Suresh → Ramesh"). Tap → day register. On mobile: list view by day instead of a grid (toggle).

### 4.13 Admin: Day register `/admin/calendar/[dateKey]`
Filters: hawker, shift, state chips (All · Delivered · Not given · Not marked · Paused). Summary bar. Table: Customer · Hawker · Shift · Status badge · Qty (default) · Marked by · Time · Edits · Reason/Note · [Edit]. Edit opens the same sheet as 4.4 with a **"Reason for correction"** field (required when outside the hawker window).

### 4.14 Admin: Reports `/admin/reports`
Month picker + hawker filter. Tabs: **Customers** · **Hawkers** · **Days**. Grand totals at the top: total litres, deliveries, reference ₹. Each tab: table + [⬇ Export CSV]. The Customers tab has a row action "Copy summary".

### 4.15 Admin: Activity, Settings
- Activity: filterable timeline (date range, actor, entity), each item: time, actor, summary, expandable before → after diff, reason.
- Settings: business form; rate card with "Change rate" dialog (new rate + effective-from date + preview "This will re-price 1,240 entries"); edit window; show ₹ to hawkers; evening start time; own PIN; language.

### 4.16 Print view (customer monthly summary)
`@media print` stylesheet: business name, customer, month, a day table (date, ☀ L, 🌙 L), totals, reference ₹, and the footer **"Delivery summary, not a bill"**. Hide nav and buttons.

---

## 5. Component inventory

shadcn/ui to add: `button, input, label, form, select, dialog, drawer, sheet, tabs, table, badge, card, dropdown-menu, popover, calendar (date picker), toggle-group, progress, sonner (toasts), skeleton, alert, separator, avatar, scroll-area, switch, radio-group, textarea, chart, pagination`.

Custom components (`src/components/...`):
| Component | Purpose |
|---|---|
| `layout/HawkerShell`, `layout/AdminShell`, `layout/LanguageToggle` | shells |
| `shared/QtyStepper` | – / + by `QTY_STEP_ML`, shows litres, min 0/500, max `MAX_QTY_ML`, 48 px buttons |
| `shared/StatusBadge` | colour + icon + label from `status-styles.ts` |
| `shared/MonthPicker`, `shared/DateNav` | month and day navigation, bounded |
| `shared/EmptyState`, `shared/ErrorState`, `shared/PageHeader`, `shared/StatCard` | |
| `deliveries/DeliveryCard` | the Today card (4.2) |
| `deliveries/NotDeliveredSheet`, `deliveries/EntryEditSheet` | reason + edit sheets |
| `deliveries/BulkMarkButton` | sticky bulk action with confirm (own or covered section) |
| `deliveries/CoveringSection` | "Covering for X" block with its own progress, list and bulk button |
| `pauses/HawkerPauseSheet` | 1–3 day pause chips for hawkers |
| `pauses/PauseList`, `pauses/AdminPauseDialog` | pause tab on the customer page |
| `substitutions/SubstitutionDialog`, `substitutions/SubstitutionList` | leave & cover management |
| `calendar/MonthGrid` | generic 7-column grid (Monday first), renders a `renderDay` slot |
| `calendar/CustomerMonthCalendar`, `calendar/DayCell`, `calendar/DayDetailSheet` | |
| `calendar/MasterMonthCalendar` | admin grid |
| `admin/DataTable` | TanStack wrapper (shadcn pattern) |

---

## 6. States, feedback, accessibility

- **Loading**: `loading.tsx` with skeletons per route; buttons show a spinner + disabled state.
- **Empty**: friendly icon + one line + action (e.g. "No customers yet. [Add customer]").
- **Errors**: `error.tsx` per segment with [Try again]; action errors as a toast using the translated message; offline (`navigator.onLine === false`) → a top banner "No internet. Your taps will not save."
- **Confirm** destructive or bulk actions (deactivate, mark all, remove mark).
- **A11y**: semantic buttons, `aria-label` on icon buttons (in the current language), visible focus ring, contrast ≥ 4.5:1, `lang` attribute switches `hi`/`en` on `<html>`.
- **Performance**: hawker pages are Server Components with small client islands (cards, sheets); no chart libraries on hawker pages; target < 200 KB JS for `/hawker/today`.

---

## 7. Copy tone (examples)

| Key | EN | HI |
|---|---|---|
| `today.markAll` | Mark all {count} remaining delivered | बाकी सभी {count} को दिया दर्ज करें |
| `status.delivered` | Delivered | दिया |
| `status.not_delivered` | Not delivered | नहीं दिया |
| `reason.customer_away` | Customer away | ग्राहक घर पर नहीं |
| `reason.customer_refused` | Customer refused | ग्राहक ने मना किया |
| `reason.skip_requested` | Skip requested | ग्राहक ने आज मना किया था |
| `reason.stock_short` | Milk short | दूध कम पड़ गया |
| `reason.other` | Other | अन्य |
| `summary.notABill` | Delivery summary, not a bill | यह केवल दूध का हिसाब है, बिल नहीं |
| `today.coveringFor` | Covering for {name} | {name} की जगह |
| `pause.noMilkFor` | No milk for | इतने दिन दूध नहीं |
| `pause.askAdmin` | For longer pauses, ask the admin | ज़्यादा दिन के लिए एडमिन से कहें |
| `sub.addCover` | Add leave / substitute | छुट्टी / बदली हॉकर जोड़ें |
| `errors.outsideEditWindow` | This date can no longer be changed. Ask the admin. | यह तारीख अब बदली नहीं जा सकती। एडमिन से कहें। |
