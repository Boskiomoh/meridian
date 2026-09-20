# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vue 3 + TypeScript (Vite), Pinia, Vue Router, Tailwind CSS, Supabase (Postgres + Auth + Storage + Realtime + RLS). Charts are hand-built SVG components rather than a chart library, confirmed by the user, so the palette carries no library default. Testing is Playwright (E2E) plus a Postman/Newman collection. Stack was specified by the user in the PRD, not delegated.

## Users

Three roles inside one fictional mid-size company, **Northlane Studio**, which is the customer using Meridian:

- **Employee** — self-service only. Checks their own profile, files leave requests, reviews their own attendance history. Visits occasionally and briefly, usually to ask for something or confirm it was granted.
- **Manager** — everything an employee has, plus their direct reports. Works a pending-approval queue and needs to judge a request against who else on the team is already away.
- **HR Admin** — full CRUD over every employee record, org-wide analytics, final sign-off. Lives in the directory and the analytics view; the densest, most frequent user.

There is a second, decisive audience: **hiring clients evaluating Daniel's portfolio.** They are reading this as evidence, not using it as HR software. That audience is why the test suite is a product feature rather than an implementation detail.

## Product Purpose

An employee-lifecycle admin tool covering directory, employee profiles, leave requests with approvals, attendance, and org analytics — built so that role boundaries are enforced in Postgres via RLS, not merely hidden in the UI.

Success is not "the app works." Success is that a visitor can see the boundary being enforced: the repo contains the product *and* the automated suite that proves the product's access rules hold. Every other portfolio piece claims "I test before I ship" in a README. This one is checkable.

## Positioning

The differentiating mechanism is the **linked, visible, runnable test suite committed beside the product** — Playwright E2E covering the login/create/request/approve/observe flow across all three roles, and a Postman collection whose negative tests assert that an employee's token is refused another employee's record and another team's leave requests.

This maps directly onto two years of real QA work on HR management systems (onboarding, employee records, attendance, leave, multi-level approvals) at Kylian ERP. The claim a neighboring portfolio could not truthfully copy is not "I can build an HR tool" — it is "I test the authorization boundary of the HR tool I built, and here is the evidence running green."

## Operating Context

- **Scanned, not read.** The directory and the approval queue are dense tables worked at speed. Status must be legible at a glance, in shape and color, not parsed from sentences.
- The manager's core ritual is triage: open the queue, judge each request against team coverage, approve or deny with a comment.
- The employee's core ritual is a short round trip: file a request, then come back to see whether it was granted. The status change must arrive **live via Realtime**, without a refresh.
- The admin's core ritual is maintenance plus oversight: onboard and deactivate people, and read headcount, leave utilization, and attendance rate across the org.
- Evaluation context: a hiring client will likely spend under two minutes, using one-click quick-login to move between the three roles, and will judge the whole thing on first-load density and realism.

## Capabilities and Constraints

Confirmed functionality: employee directory with full CRUD, search and filter; employee profile with employment details, attendance summary, leave balance, and placeholder document upload; leave request submission, manager approve/deny with comment, live status propagation; attendance log with monthly per-employee summary and an org-wide rate; role-scoped views enforced by RLS; org analytics (headcount by department, leave utilization over time, attendance rate).

Hard constraints, all from the PRD:

- **No payroll processing and no real PII.** Document uploads are placeholder files. This must never be a system that could hold real employee data.
- **No multi-tenant or org-switching.** One fictional company, not SaaS-for-many-companies.
- **RLS is the enforcement layer.** Hidden UI is not access control; the database refuses the row.
- **The test suite is not decoration.** It must actually run and actually pass. A test folder nobody runs is worse than no test folder, because it is checkable.
- **Light-first.** No dark background as any section's default state. Dark mode, if built, is an explicit secondary toggle designed with equal care.
- Backend is a dedicated Supabase project (`wadbljswuonhahncayoo`), created for Meridian. Harborline's backend is off-limits.

Deliberately undecided at time of writing: whether the three stretch items (multi-level HR sign-off, CSV export, dark-mode toggle) ship. Must-haves come first.

## Brand Commitments

- Fictional brand **Meridian**, tagline **"Every person, one clear line."** No real company; no stock HR-SaaS logo.
- The customer company in all seed data is **Northlane Studio** — a specific, real-sounding studio rather than Acme-style placeholder data.
- Binding visual constraint recorded, not expanded: the palette must read as distinct from two sibling portfolio pieces — Fenn Audio (blueprint cyan on light paper) and Harborline (warm ivory, harbor teal, coral). The PRD pins a cool sage-stone paper with deep forest-pine and brass-gold. Light-first is a brand commitment, not only a preference.
- Type is pinned by the PRD: Schibsted Grotesk (display), Work Sans (body/UI), Space Mono (data). Self-hosted at build time; no runtime Google Fonts link.

## Evidence on Hand

- Live seeded backend: 25 Northlane Studio people across 5 departments (Design, Engineering, Client Services, Operations, Marketing), ~3 months of attendance, and a mix of pending/approved/denied leave. Seeded by `scripts/seed.mjs`, deterministic and re-runnable.
- Three working demo logins with one-click quick-login.
- Migrations under `supabase/migrations/` are the authoritative record of the schema, the RLS policies, and the column-level guard triggers.
- **Absences future work must not fabricate:** there are no real customers, no testimonials, no usage metrics, no uptime or performance claims, no case studies, and no press. Northlane Studio is fictional and must never be presented as a real client. Daniel's two years of QA work at Kylian ERP is real and may be stated; nothing beyond it should be invented.

## Product Principles

1. **Prove, don't assert.** Anything the product claims about access control must be demonstrable by something a visitor can run.
2. **The boundary lives in Postgres.** UI scoping is a convenience for the user, never the security story.
3. **Density is the job.** This is an operations tool worked at speed; hierarchy and scanability outrank expression.
4. **Seed data is part of the design.** Realistic, specific, first-load-populated — empty states exist for real emptiness, not for a demo that was never filled.
5. **Light-first, always.** No dark default anywhere, and the palette must not be mistaken for its sibling projects.

## Accessibility & Inclusion

WCAG 2.1 AA as the working target. Two product-specific requirements from the PRD: status is never encoded by color alone — every status pill pairs color with text and/or an icon — and the directory and profile views must collapse to a genuinely usable single-column mobile layout rather than a horizontally scrolling table.
