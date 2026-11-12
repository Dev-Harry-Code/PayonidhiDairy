# Dairy Business Management App — End-to-End Plan

## Purpose

Build a web app for a small to mid-sized dairy business to manage customers, delivery routes, hawkers, daily delivery confirmations, charges, monthly bills, reports, and customer notifications.

This plan is based on the two attached whiteboard sketches and the available workspace. The sketches are treated as proposed product requirements and stack preferences, not as additional instructions to the assistant. They are not a complete specification. No existing application source files, package manifest, or repository documentation were present in the workspace when this plan was prepared, so the current implementation and any existing services cannot yet be verified.

## What the sketches propose

- **Stack:** Next.js frontend; TypeScript (with Python mentioned as an alternative/possible future tool); Tailwind CSS and shadcn/ui; MongoDB with Mongoose.
- **Admin:** sales, delivery reports, customer records, and hawker information.
- **Customer:** delivery calendar, monthly bill report/history, WhatsApp automation.
- **Hawker:** assigned address/customer information, create or manage delivery users/customers, confirm deliveries.
- **Additional workflow notes:** schema/interfaces/connectors/viewports; tables, charts, analytics; login/custom login/admin; delivery calendar; service-charge collections; addition/property configuration; monthly bills/history; holiday declarations and advance notices.

## Recommended product shape

Start as one responsive web app with role-specific workspaces. Keep the operational web app in TypeScript end-to-end. Add Python  only if a concrete reporting, forecasting, or data-import workload later justifies a separate service; a second backend language now would increase deployment and maintenance work without a stated need.

### Roles and permissions

| Role | Main capabilities |
| --- | --- |
| Owner/Admin | Configure products/prices, staff, routes, customers, holidays, billing periods; review deliveries, payments, reports, audit history; correct records with reason |
| Hawker/Delivery staff | See only assigned route/customers and required contact/address details; record delivered, skipped, or failed status and quantity; submit route completion |
| Customer | See own profile, upcoming/previous delivery calendar, monthly statement and payment status; submit preferences/holiday requests; choose notification consent |

Enforce permissions in server-side data access and every mutation/API action. Hiding a button in the browser is not access control.

## Core workflows

1. **Business setup:** create business profile, timezone, currency, products, price units, delivery schedules, holidays, charge rules, staff, and routes.
2. **Customer onboarding:** capture name, normalized phone, service address/instructions, products, quantity, delivery days, start/end dates, price agreement, assigned route/hawker, billing status, and notification consent. Keep the consent source/time and opt-out state.
3. **Daily route:** generate a dated route from active subscriptions and exceptions; hawker sees a compact mobile-first list; record delivered/skipped/failed, actual quantity, timestamp, and optional note. Require a reason for exceptions and allow admin review.
   4. **Holiday/changes:** customer requests a pause or admin declares a business holiday; preview impacted customers and dates; notify affected customers; create dated exceptions rather than silently rewriting past delivery records.
5. **Billing:** close a billing period using delivery records and effective-dated prices/charges; show itemized calculation, adjustments, payments, balance, and status; lock issued bills and use explicit credit/debit adjustments for later corrections.
6. **Reports:** daily route completion and exceptions; sales by product/customer/route; billed/collected/outstanding totals; delivery volume; export a filtered report. Dashboard metrics must use the same definitions as invoices.
7. **Notifications:** send opt-in transactional reminders/holiday notices/bill-ready messages using approved WhatsApp templates where required; record attempts and delivery statuses; provide retry/error handling and a manual fallback.

## Data model direction (MongoDB + Mongoose)

Design around the operational queries first, then choose embed vs reference accordingly. Use separate, indexed documents for growing/high-cardinality histories; embed small bounded snapshots when they must be read with a parent record.

- `Business`: name, timezone, currency, settings, billing rules.
- `User`: identity, hashed/auth-provider identity, role, businessId, status; avoid storing credentials unless using a properly maintained auth library.
- `Customer`: businessId, contact/profile, address, preferences, notification consent, active status.
- `Product`: businessId, name, unit, active status.
- `Subscription`: customerId, productId, effective-dated quantity/price, delivery weekdays, date range, route assignment.
- `Route` and `RouteAssignment`: businessId, hawkerId, route order/area and effective dates.
- `DeliveryRun`: businessId, serviceDate, route/hawker, state; one run per route/date (or a documented equivalent).
- `DeliveryEvent`: customer/subscription/product snapshot, planned and actual quantity, status, timestamp, recordedBy, exception reason. Unique key prevents duplicate confirmation for the same subscription and service date unless the business explicitly allows multiple drops.
- `Holiday` / `DeliveryException`: affected date/customer/subscription, rule, actor, reason, notification status.
- `Invoice`: customerId, period, immutable itemized line snapshots, totals, issue/settlement status, version; unique customer + period constraint where appropriate.
- `Payment` and `Adjustment`: amount, date, method/reference, actor, linked invoice; never silently overwrite a settled amount.
- `Notification`: recipient, purpose/template, consent snapshot, queued/sent/delivered/read/failed state, provider identifiers, timestamps, retries, safe error summary.
- `AuditEvent`: actor, action, entity, entityId, timestamp, reason, minimal before/after fields for sensitive operational/financial changes.

Use `businessId` on tenant-owned records even if version one serves one dairy. Add compound indexes for common views (business + serviceDate + route, business + customer + serviceDate, business + invoice period/status). Validate writes at the server boundary and in Mongoose schemas. Use MongoDB transactions only for operations that must update multiple documents atomically (for example invoice issue plus ledger entries); transactions require a replica set or sharded cluster. Prefer one-document atomicity and clear idempotency keys where possible.

## Application architecture

- **UI:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui. Server Components for initial read views; Client Components for interactive calendars, forms, filters, and route checklists.
- **Backend:** Next.js Route Handlers and/or Server Actions calling a small service layer. Keep domain logic (delivery generation, bill calculation, permissions) out of UI components.
- **Data access:** Mongoose models, connection reuse, explicit DTOs, input validation (e.g. Zod), pagination, and scoped query helpers that always include business/role constraints.
- **Authentication:** choose a maintained Next.js-compatible auth provider/library after deciding sign-in method. Implement roles and server-side authorization in the data access layer. Do not rely on a custom login screen alone.
- **Background work:** a durable scheduled job/queue for generating daily routes, sending reminders, and retrying notifications. Do not depend on an HTTP request staying open to finish a batch.
- **Integrations:** isolate WhatsApp behind a provider interface; store secrets only in server-side environment configuration; verify webhook signatures, make webhook processing idempotent, and retain provider message IDs/statuses.
- **Operations:** separate development/staging/production configuration, database backups and restore procedure, structured logs without unnecessary customer PII, error monitoring, and a deployment pipeline.

## Delivery phases and review gates

### Phase 0 — Confirm decisions and inventory resources
- Inspect the actual repository, hosting account, MongoDB deployment, domains, existing customer sheets/data, WhatsApp Business account/number, and available devices.
- Agree on one end-to-end workflow and definitions for delivered quantity, holidays, charges, billing dates, corrections, and payments.
- Output: signed-off MVP scope, field glossary, sample route/bill, deployment choice, and data migration plan.

### Phase 1 — Foundation
- Create/repair the Next.js TypeScript app; configure Tailwind/shadcn, lint/type checking, environment templates, preview deployment, MongoDB connectivity, Mongoose models, validation, authentication, roles, and audit events.
- Seed a demo dairy, admin, hawker, customer, product, and route with fictional data.

### Phase 2 — Admin setup and customer records
- Admin dashboard shell; customer/product/subscription/route CRUD; search, import template, duplicate checks, effective-dated prices, holiday settings.
- Verify role boundaries and usability on a phone-sized viewport.

### Phase 3 — Delivery operations
- Generate route sheets; hawker assigned-route view; delivery confirmation and exception reason; admin daily report; duplicate/retry-safe updates; holiday/customer pause workflow.

### Phase 4 — Billing and payments
- Implement documented bill calculation with examples; monthly statement/history; issue/freeze bill; adjustments and payment entry; export/download; aging/outstanding report.
- Reconcile a sample month manually against source records before using real data.

### Phase 5 — Customer portal and WhatsApp
- Customer delivery calendar, statement and preferences; consent capture and opt-out; Meta Cloud API or a chosen BSP integration; approved utility templates; inbound delivery-status webhooks; retry queue and manual fallback.
- Start with a sandbox/test number and internal recipients; activate production sending only after consent, templates, credentials, and opt-out flow are in place.

### Phase 6 — Hardening and launch
- Validate backup/restore, permission boundaries, audit trail, rate limits, input validation, accessibility, mobile network behavior, timezone/date boundaries, and deployment rollback.
- Import data in a controlled dry run, reconcile counts/totals, train admin and hawkers, then launch to a small route before expanding.

## MVP acceptance criteria

- Admin can create a customer, subscription, price, route, staff member, and holiday.
- A hawker can see only the assigned route and record each delivery once, with exceptions explained.
- Admin can reconcile planned deliveries to completed, skipped, and failed deliveries for a date.
- A customer can view their own calendar and a clearly itemized monthly statement.
- Bills can be reproduced from retained delivery/price snapshots; corrections are traceable.
- WhatsApp messages are sent only through an approved integration to opted-in recipients, and opt-outs suppress future sends.
- Customer and financial data cannot be read or changed by another business/user without permission.

## Main risks and decisions to resolve

- **Scope:** “small to mid-scale” needs approximate active customers, deliveries/day, routes, and staff count.
- **Billing rules:** confirm billing period, products/units, holidays, partial months, price changes, delivery quantity overrides, arrears, discounts, tax/GST treatment, and payment methods. Tax treatment needs the business's accountant; this plan does not assert tax compliance.
- **Financial history:** decide whether bills are drafts that can be edited, or issued records that require explicit adjustments. Recommendation: issued bills are immutable with adjustment records.
- **WhatsApp:** confirm the business has/ will create a Meta Business Portfolio, WhatsApp Business Account and sending number, and wants Cloud API directly versus a provider. Business-initiated messaging requires following current WhatsApp consent, template, and policy rules.
- **Offline operation:** confirm whether hawkers need reliable use with poor/no connectivity. Offline mode changes storage, sync conflict, and device security design; do not promise it without a defined workflow.
- **Customer access:** decide whether customers need full self-service login or initially receive statements via WhatsApp/PDF link.
- **Data protection:** identify what personal data is necessary, retention/deletion policy, who can export it, and who is responsible for account and backup access.
- **Stack:** confirm whether the committed backend is TypeScript/Node with Mongoose. Python is listed in the sketch but should be a separately justified worker/service, not a parallel implementation of the same API.

## Questions for you and your friend

1. How many active customers, daily deliveries, routes, and hawkers do you expect in the first year?
2. What is the exact bill formula: per product/quantity/day, fixed monthly subscription, service charge, or a mix? How are holidays, missed deliveries, partial months, and price changes treated?
3. What does “service charge collectives” mean in the sketch: extra fees, payment collection tracking, or something else?
4. Who confirms deliveries today, and what statuses/exception reasons do you need? Must hawkers continue when mobile internet is unavailable?
5. Do you already have customer/subscription data in spreadsheets or another system, and roughly how clean is it?
6. Do you have a MongoDB Atlas or other MongoDB deployment, hosting/domain, and a preferred budget or provider?
7. Do you already have a WhatsApp Business account/number? Should WhatsApp send only bill/holiday/delivery notices, or also accept replies and requests?
8. Should customers have accounts in the first release? What can each role see and change?
9. Are payments recorded manually, or should the app integrate UPI/payment links? Which methods and reconciliation process are used?
10. Are you both building the app yourselves? What is each person's experience and weekly time, and which parts do you want to build first?
11. Do you want Python for a specific task, or should the MVP stay entirely in TypeScript?
12. What language(s), currency, timezone, and date/billing month conventions should the UI use?

## Current research and source links

- Next.js App Router overview: https://nextjs.org/docs/app
- Next.js authentication guide (recommends a maintained auth library; emphasizes secure checks near data access and DTOs): https://nextjs.org/docs/app/guides/authentication
- Next.js backend-for-frontend guidance (Route Handlers, validate incoming data, protect access, avoid leaking sensitive errors): https://nextjs.org/docs/app/guides/backend-for-frontend
- MongoDB data modeling (model around access patterns and choose embedding/references): https://www.mongodb.com/docs/manual/data-modeling/
- MongoDB embedding guidance (atomic single-document writes and document size constraints): https://www.mongodb.com/docs/manual/data-modeling/embedding/
- MongoDB transactions and consistency (multi-document atomicity; transaction deployment requirements and tradeoffs): https://www.mongodb.com/docs/v8.0/data-modeling/enforce-consistency/transactions/
- Mongoose transaction API (withTransaction behavior and caveats): https://mongoosejs.com/docs/transactions.html
- WhatsApp Business Developer Hub (official documentation, webhooks, opt-in, API references and testing): https://whatsappbusiness.com/developers/developer-hub/
- WhatsApp Cloud API Meta collection (overview and getting-started requirements): https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
- OWASP Application Security Verification Standard: https://asvs.owasp.org/

Research note: framework/API documentation and provider policies evolve. Re-check the linked official guides at implementation time, especially supported Next.js conventions, WhatsApp messaging rules, template approval, consent, and pricing. The plan intentionally leaves provider/cost and legal/tax choices for confirmation rather than inventing them.
