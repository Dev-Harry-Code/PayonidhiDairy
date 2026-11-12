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
