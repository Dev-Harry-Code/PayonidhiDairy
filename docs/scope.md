# Payonidhi Dairy — One-Week MVP Scope

This is the active scope for the first usable release. It supersedes deferred feature detail in older sections of the documentation. The target is **45–65 focused development hours over seven calendar days** with an AI coding agent.

## MVP included

- One dairy, one admin, and hawkers
- Phone + PIN login with server-side role checks
- Hawker list and basic customer records
- Morning/evening delivery marking with 0.5 L steps
- Delivered / not delivered status with reason
- Idempotent saves and audit records
- Hawker Today screen, admin Today view
- Simple customer month calendar
- Monthly litres, delivery counts, and reference-only ₹ amount
- Seed data, core unit/service tests, basic responsive styling
- Local production build and one Vercel deployment

## Deferred after the MVP

- Substitute hawkers and leave cover
- Customer pauses
- Advanced admin settings and route drag-and-drop
- Full master calendar and correction workflow
- CSV export, print view, copy-summary polish, and activity-log UI
- PWA install experience
- Full Hindi translation coverage
- Full Playwright suite, accessibility/performance audit, and production hardening
- One-week pilot (required after the MVP is deployed)

## Seven-day delivery plan

| Day | Scope |
|---|---|
| 1 | P0.2 core libraries, models, seed fixtures |
| 2 | Authentication, roles, and app shells |
| 3 | Hawkers, customers, and minimal admin screens |
| 4 | Delivery engine, Today screen, audit tests |
| 5 | Customer calendar and monthly totals |
| 6 | Deployment, integration fixes, responsive pass |
| 7 | Phone smoke test, bug fixes, MVP handoff |

## Completion rule

The MVP is complete when the seeded admin can create or view a hawker and customers, the hawker can log in and mark a day, the admin can see those entries and monthly totals, and lint, typecheck, tests, and build are green.
