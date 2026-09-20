# Meridian — Handoff

Written 2026-09-16, at the end of the build session. Read this before resuming work — it
says what's actually done, what's assumed, and where the loose ends are. Nothing in here
should be taken as "shipped and forget"; treat it as the state to verify against, not a
guarantee.

## What this project is

People-ops admin tool for a fictional company, Northlane Studio. Full spec in
`Meridian-PRD.md` / `Meridian-WORKFLOW.md` (repo root's parent — not copied into this
repo). Product framing lives in `PRODUCT.md`. Design system lives in `DESIGN.md`,
generated from the shipped build by the impeccable documenter, not written in advance.

**The whole point of this project**: the repo contains its own proof that RLS actually
enforces the role boundary — see `README.md`'s Testing section, which is written to be
read, not skimmed.

## Current status: all PRD must-haves built and verified

- Schema, RLS, column-guard triggers, Storage bucket, Realtime — all in
  `supabase/migrations/` (4 migrations, applied).
- One privileged Edge Function, `create-employee` (deployed).
- Full UI: directory, profiles, leave + approvals, attendance, analytics, login. Rail +
  inspector shell, per `.impeccable/surfaces/src-app-vue.md`'s direction contract.
- Data layer: TanStack Query + Zod (see below) — this replaced an earlier Pinia-only
  version mid-session; the Pinia stores for people/leave no longer exist.
- Test suite: 15 Playwright specs, 1 Postman collection (24 requests / 47 assertions).
  **Both currently pass.** Re-verify before trusting that claim if time has passed —
  commands below.
- Seed data: 25 people, 84 leave requests, 4013 attendance rows. Deterministic,
  re-runnable, and self-cleaning (deletes any auth user not in its own roster, so
  repeated E2E runs don't accumulate stray fixtures).

**Not built** (explicitly deferred, per PRD Section 5 stretch list): multi-level HR
sign-off, CSV export, dark-mode toggle. Not started, not partially done.

**Not deployed.** Runs locally against a live Supabase project. No Vercel deploy was
requested or performed this session.

## Backend

- **Supabase project**: `meridian`, ref `wadbljswuonhahncayoo`, region `eu-west-1`,
  created fresh this session (org `tyudzrkojodjmmmmsmfi`). Harborline's project
  (`veloce-3d-viewer` / `qgrkrrlccxtniuyflode`) was never touched — confirm this is still
  true if anyone else has been working in the same org.
- The claude.ai Supabase **MCP connector is pinned to Harborline's project**, not this
  one. All schema/migration work here went through the Supabase CLI directly
  (`npx supabase db push`, linked via `npx supabase link --project-ref wadbljswuonhahncayoo`).
  If you reach for `mcp__claude_ai_Supabase__*` tools expecting them to touch Meridian,
  they won't — they'll touch Harborline. Don't run `get_advisors` and assume it covered
  this project; it didn't. The security-advisor equivalent checks were run by hand via
  the Management API (RLS-enabled-on-every-table, every RLS table has ≥1 policy, no
  `SECURITY DEFINER` function with a mutable `search_path`) — all clean as of this
  session, but that was a point-in-time check, not a standing one.
- **Credentials**: `.env.local` (gitignored) has the public URL + publishable key, safe
  to keep. The Supabase **personal access token** used to create the project and push
  migrations was pasted into chat by the user and stashed only in this session's
  scratchpad (`sb.env`, not part of the repo). **That token should be revoked** at
  supabase.com/dashboard/account/tokens if it hasn't been already — it was never meant to
  be long-lived. The service-role key (used only by `scripts/seed.mjs`, passed via env
  var at invocation, never written to a file) bypasses RLS; don't put it in `.env.local`.

## Data layer — read this before touching any view

This was rebuilt mid-session (TanStack Query + Zod replacing a first-pass Pinia-only
version) at the user's explicit request. Full rationale is in `README.md`'s Architecture
section and in `.impeccable/WORKFLOW-tanstack-migration.md` (the plan it was executed
against). Short version:

```
src/schemas/    Zod schema per table + composed shapes, checked against real
                PostgREST output, not just the generated types
src/api/        plain async functions — supabase.from(...) in, a parsed row out
src/queries/    useQuery / useMutation composables — what views actually call
src/stores/     Pinia, now holding ONLY: auth session (stores/auth.ts) and
                directory filter UI state (stores/peopleFilters.ts)
```

- **In-memory cache only, by deliberate choice** — no persister, nothing in
  `localStorage`. `queryClient.clear()` runs on every sign-out specifically because
  without it a same-tab account switch could leak one account's cached data into
  another's view (this was a real bug caught during the migration, not a hypothetical).
- Realtime (`src/queries/leave.ts`, `useLeaveRealtime`) patches the query cache directly
  via `setQueryData` rather than refetching the whole list on every change.
- If you add a new resource, follow the existing three-layer split
  (`api/` → `queries/` → component) rather than fetching from a component directly —
  that consistency is what makes the cache invalidation predictable.

## Design

- Palette/type/shell decisions: `.impeccable/surfaces/src-app-vue.md` (the direction
  contract) and `DESIGN.md` (derived from the shipped build by the impeccable
  documenter subagent — trust this over the contract if they ever disagree, since the
  contract describes intent and DESIGN.md describes what actually shipped).
- A finish-review pass was dispatched via the impeccable finish-reviewer subagent
  mid-session. **Its specific findings were not captured in this handoff** — the
  session moved on to other requested work (responsive fix, favicon, data-layer
  migration) before those findings were explicitly relayed and acted on one by one.
  If a design QA pass matters before this is shown to anyone, re-run it:
  `/impeccable audit` or re-invoke the finish-reviewer against the current build,
  since several views have changed since that review ran.
- Known-fixed issues from this session, in case they resurface: the `/analytics` route
  had a real horizontal-scroll bug (a `<table class="sr-only">`'s `<caption>` forced a
  minimum width that `overflow:hidden` couldn't clip — fixed by wrapping in a `<div
  class="sr-only">` instead, which is the structurally correct pattern, not a patch).
  Verified clean at 320–1024px on every route via `npm run test:overflow`.

## Commands that actually matter

```bash
npm run dev                # localhost:5173
npm run build               # typecheck + production build
npm run test:e2e             # 15 Playwright specs — should all pass
npm run test:api             # Postman/Newman — 24 requests, 47 assertions
npm run test:overflow        # horizontal-scroll regression check, 320–1024px
npm run test:perf            # LCP/CLS/interaction against a served build
npm run seed                 # reset to the clean 25/84/4013 demo dataset
npm run shots                 # desktop + mobile screenshots to shots/ (gitignored)
```

If `npm run test:e2e` fails after time has passed, the most likely cause is dataset
drift from repeated manual testing (the create-employee spec really creates a user).
Run `npm run seed` first — it's idempotent and self-cleaning — before assuming the app
itself regressed.

## Honest gaps / things not independently re-verified

- The finish-reviewer's findings (see Design section above).
- No unit tests exist — by design, per README, since the logic worth testing is in SQL
  and covered by the two suites above. Worth a second opinion if that trade-off matters
  to whoever inherits this.
- No CI is configured. Every "passes" claim in this handoff was verified by actually
  running the command locally this session, not inferred.
- Not deployed anywhere; no production URL, no Vercel project, no domain.
