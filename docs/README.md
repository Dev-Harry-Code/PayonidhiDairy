# Payonidhi Dairy — Project Docs Kit (v1 draft)

> Working name: **Payonidhi Dairy** (पयोनिधि डेयरी). Rename anytime — search & replace "Payonidhi Dairy" in all files.

A mobile-first web app where **hawkers mark daily milk deliveries on a calendar** (who got milk, how much, morning/evening, when, and who didn't) and an **admin** manages customers and hawkers and sees everything.
**No billing, no invoices, no payments inside the app.** Money is settled outside the app between customer and admin. The app only shows a *reference* ₹ amount (litres × rate).

---

## The files and how they connect

For the active one-week release boundary, read `scope.md` first. It defines the MVP included in 45–65 focused hours and explicitly defers the broader roadmap.

| # | File | What it is | Who reads it |
|---|------|------------|--------------|
| 1 | `plan.md` | **Product plan**: what we build, for whom, scope in/out, rules, acceptance criteria | You + AI (every phase) |
| 2 | `implementation-plan.md` | **Technical plan**: stack, architecture, folder structure, phase-by-phase tasks | AI (every phase) |
| 3 | `design.md` | **UI/UX**: design tokens, colours, every screen wireframe, components | AI (UI phases) |
| 4 | `data-model.md` | **Database**: every collection, field, index, and the core "expected delivery" logic | AI (every backend phase) |
| 5 | `api.md` | **Server actions / endpoints**: names, inputs, outputs, permissions | AI (backend + UI phases) |
| 6 | `testing.md` | **Tests + acceptance checks** for each phase, manual phone test scripts | You + AI |
| 7 | `skill.md` | **The AI's rulebook**: coding rules, conventions, output format, non-negotiables | AI (**always attach**) |
| 8 | `prompt.md` | **Copy-paste prompts**, one per phase step, each with "Expected output" | You |
| 9 | `progress.md` | **Living tracker**: checkbox per task, decisions, current state. AI updates it at the end of every prompt | You + AI (**always attach**) |

```
              plan.md  (WHAT & WHY)
                 │
     ┌───────────┼──────────────┐
     ▼           ▼              ▼
design.md  implementation-   data-model.md ──► api.md
 (LOOK)     plan.md (HOW)     (DATA)          (ACTIONS)
     └───────────┼──────────────┘
                 ▼
            skill.md (RULES the AI must follow)
                 ▼
            prompt.md (STEP-BY-STEP prompts) ──► code
                 ▼
            progress.md (what's done)  +  testing.md (how we verify)
```

**Golden rule:** if you want to change a feature, change the docs first (`plan.md` → affected doc), then run the prompt. Use the "Change Request" prompt in `prompt.md` for that.

---

## How to use it with ChatGPT / Gemini / any chat AI

1. Create the project folder once (Phase 0 prompt does this) and copy all these `.md` files into `payonidhi-dairy/docs/`.
2. For **each prompt** in `prompt.md`:
   1. Open a **new chat** (keeps the AI focused, avoids context overflow).
   2. **Attach** the files listed under "Attach" for that prompt (always `skill.md` + `progress.md`).
   3. For prompts that change existing code, also attach a code bundle:
      `npx repomix --include "src/**,scripts/**,package.json" -o code-bundle.txt` → attach `code-bundle.txt`.
   4. Paste the prompt text.
   5. The AI replies with **full files** (path + full content), commands to run, and a `progress.md` update.
   6. Paste the files into your project, run the commands, do the "Verify" checks.
   7. Update `docs/progress.md`, then `git commit`.
3. If the answer gets cut off → use the **Continue** prompt. If something breaks → use the **Fix Error** prompt.

---

## Decisions locked (v2)

| Topic | Decision |
|---|---|
| App name | **Payonidhi Dairy** (पयोनिधि डेयरी) |
| Framework | **Next.js** (App Router) + TypeScript: one app for frontend + backend |
| Users | Admin + multiple hawkers (no customer login) |
| Product | Milk only, one type, in litres, **0.5 L steps** |
| Money | Reference only: monthly litres × rate shown to admin. No payments, no bills, no dues |
| Login | Phone number + PIN |
| Quantity marking | Each customer has a default qty; pre-filled; hawker taps Delivered / Not delivered or edits qty |
| Shifts | Morning + Evening (marked separately) |
| Language | Hindi + English toggle |
| Customer edits | Admin only |
| Pauses | Admin: any length · Hawker: 1–3 days for his customers |
| Leave cover | **Substitute hawker**: admin sets "X covers Y from–to"; X sees and marks Y's customers on those dates |
| Holidays | Dropped |
| Connectivity | Online only (clear error + retry), installable to home screen |
| Size | 150–600 customers, 3–10 hawkers |
| Hosting | **GitHub** repo → **Vercel Hobby** (free, auto-deploy on push) + **MongoDB Atlas M0** (free, Mumbai) |
| AI tool | Chat-based (ChatGPT/Gemini) → prompts are self-contained with attachments |

## GitHub flow (summary)
1. P0.1 connects your existing repo (`git remote add origin …` → `git push -u origin main`) and puts these docs in `docs/`.
2. After every prompt: paste files → run checks → update `docs/progress.md` → `git commit` → `git push`.
3. Import the repo once on vercel.com; after that every push deploys automatically (P7.2 finishes production setup).

`reference/` holds the two original plans (yours and your friend's) for traceability.
