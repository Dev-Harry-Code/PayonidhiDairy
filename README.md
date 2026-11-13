# Payonidhi Dairy

Payonidhi Dairy is a mobile-first digital milk register. Hawkers record morning and evening deliveries, while admins manage the dairy's customers, hawkers, pauses, substitutions, calendars, and reports.

The v1 scope intentionally excludes billing, payments, customer login, messaging automation, offline sync, and multiple products. The displayed rupee amount is reference-only and is not a bill.

## Requirements

- Node.js LTS (Node 24 recommended for the current Next.js toolchain)
- npm
- MongoDB Atlas or a local MongoDB instance for later phases

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

## Launch checklist

Before production use, set `MONGODB_URI`, a randomly generated `SESSION_SECRET` of at least 32 characters, and `APP_URL` in the hosting provider. Create the first admin with `npm run create-admin`, then seed only test data in non-production environments. Run the production build, verify admin and hawker logins on a phone, and keep a backup of the MongoDB database before the pilot.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check ESLint rules |
| `npm run typecheck` | Run TypeScript checks |
| `npm run format` | Format supported source files |
| `npm test` | Run the unit and integration test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright tests |
| `npm run seed` | Seed development data (added in Phase 1) |
| `npm run create-admin` | Create an admin user (added in Phase 1) |

## Documentation

The implementation source of truth is in [`docs/`](docs/). The original attached archive is retained at the repository root for reference.
