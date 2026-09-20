# Meridian

**Every person, one clear line.**

A people-operations admin tool — employee directory, profiles, leave requests with
multi-role approvals, attendance, and org analytics — built for a fictional mid-size
company, **Northlane Studio**.

The point of this project is not that it manages employees. It is that **the role
boundaries are enforced in Postgres, and the repo contains the automated suite that
proves it.** An employee's session cannot read another employee's record — not because
the interface hides it, but because the database refuses the row. That claim is
checkable, and [the tests below](#testing) are how you check it.

I spent two years as a QA Engineer at Kylian ERP testing exactly this category of
system: onboarding, employee records, attendance, leave, multi-level approvals. This is
that domain, built rather than tested — with the tests included.

---

## Testing

**This section is the reason the project exists.** Both suites are committed, both run
against the real backend, and both are expected to pass.

```bash
npm run test:e2e     # Playwright — 15 specs, full browser, real Supabase
npm run test:api     # Newman/Postman — REST-level RLS verification
```

### Playwright (`e2e/`) — 15 specs

| File | What it proves |
|---|---|
| `01-roles.spec.ts` | Each of the three roles signs in and sees exactly its own scope. An employee is redirected away from `/directory` and `/analytics`; a manager sees 5 people (self + 4 reports) and no Analytics link; an admin sees all 25. Signing out re-protects every route. |
| `02-leave-approval.spec.ts` | The core product flow end to end: an admin creates an employee → an employee files a leave request → the manager approves it with a comment → **the employee's page updates live**. |
| `03-rls-boundary.spec.ts` | The authorization boundary, asserted at the API rather than the UI. |

The live-update spec is the one worth having a browser for. It opens **two browser
contexts at once** — employee and manager — and asserts that the employee's view flips
to `Approved` with **no `page.reload()` anywhere in the test**. If Realtime broke, or if
the status were only refreshed on navigation, that assertion would fail.

`03-rls-boundary.spec.ts` deliberately **does not click anything**. It lifts the
signed-in user's own access token out of `localStorage` and calls the Supabase REST API
directly, bypassing the application entirely — which is what an attacker would do. It
asserts that an employee's token:

- reads their own record, but gets **0 rows** for another employee's;
- gets **0 rows** for another team's leave requests and attendance;
- gets only their own rows even from a completely **unfiltered** `select`;
- is refused **403** when trying to set its own `role` to `admin`;
- cannot approve its own leave — and the request is **re-read afterwards** to confirm it
  is still `pending`, because an empty response array on its own is weak evidence;
- is refused **403** by the privileged `create-employee` Edge Function.

It also checks the manager boundary: a manager can read a direct report, and gets 0 rows
for someone else's report.

### Postman / Newman (`postman/`) — 24 requests, 47 assertions

The same boundary, one layer lower: no browser, no application code, just HTTP.

```bash
npm run test:api
# or, in the Postman app, import both files from postman/
```

- `postman/meridian.postman_collection.json`
- `postman/meridian.postman_environment.json`

Organised so the negative tests are impossible to miss — folder **`3 · Employee —
NEGATIVE`** is the heart of it, with every request prefixed `✗`. It covers cross-employee
reads, cross-team leave and attendance, unfiltered reads, self-promotion to admin,
re-pointing your own reporting line, approving your own leave, filing leave on someone
else's behalf, and calling the admin-only Edge Function. Folder `5 · Anonymous` confirms
nothing at all is readable without a session.

The environment deliberately contains **no service-role key**. A service-role key
bypasses RLS, so using one here would quietly invalidate every negative test in the file.

### Performance

`npm run build && npm run preview`, then `npm run test:perf`. Lighthouse on an auth-gated
app only ever measures the login page, so this signs in and reads the same
`PerformanceObserver` entries Lighthouse uses, on the three routes the brief actually
names. Measured against the production build:

| Route | LCP | CLS | Interaction |
|---|---|---|---|
| `/directory` | 544 ms | 0 | 112 ms |
| `/me` | 736 ms | 0.029 | — |
| `/leave` | 424 ms | 0.0001 | 133 ms |

Budget: LCP ≤ 2500 ms, CLS ≤ 0.1, interaction ≤ 200 ms. The interaction figure is a
proxy — time from click to painted response — not a true field INP, and it is blank for
`/me` because that route has no list rows for the script to click. LCP on `/leave` and
`/directory` is markedly faster than an isolated cold load would be, because the script
visits routes in sequence in one session and TanStack Query's cache serves the second and
third navigations from memory — the same effect a real person gets clicking around the
app, which is the whole reason that cache exists.

### What is *not* covered

Honest gaps, rather than a claim of total coverage: there are no unit tests (the logic
worth testing is in SQL and is covered by the two suites above), no visual regression
tests, and no load testing. The Playwright suite runs serially with one worker because it
mutates shared demo rows — a parallel suite here would flake, and a flaky suite proves
nothing.

---

## Demo logins

One-click quick-login on the sign-in screen, or type them in. Password for all three:
`Northlane!2026`

| Role | Email | Sees |
|---|---|---|
| Employee | `maya.okonkwo@northlane.studio` | Only her own profile, leave and attendance |
| Manager | `tobias.lind@northlane.studio` | Herself plus 4 direct reports, and an approval queue |
| HR Admin | `priya.raghunathan@northlane.studio` | All 25 employees, full CRUD, org analytics |

Sign in as each in turn and watch what changes. The difference is not cosmetic.

**The 60-second walkthrough:** sign in as the admin and add an employee → sign in as Maya
and request leave → sign in as Tobias, approve it, and watch Maya's tab update without a
refresh → then run `npm run test:e2e`.

---

## Architecture

- **Frontend:** Vue 3 + TypeScript, Vite, Vue Router
- **Data layer:** TanStack Query (`@tanstack/vue-query`) + Zod — see below
- **Client UI state:** Pinia, scoped to exactly what Query doesn't own (auth session,
  directory filters, dialog/selection state)
- **Styling:** Tailwind CSS v4, with the design tokens defined in `src/style.css`
- **Backend:** Supabase — Postgres, Auth, Storage, Realtime, and RLS on every table
- **Charts:** hand-built SVG components (`src/components/charts/`). No chart library:
  the palette carries no third-party default, and the bundle carries no third-party
  weight.
- **Privileged operations:** one Supabase Edge Function (`supabase/functions/create-employee`)
- **Testing:** Playwright + Postman/Newman

### Data layer: TanStack Query + Zod, not ad hoc fetches

Every read is a cached `useQuery`; every write is a `useMutation` that invalidates the
cache it affects. Switching Directory → Leave → Directory does not refetch the employee
list a second time — the whole point of adding this layer was to stop re-requesting data
the app already has.

```
src/schemas/    one Zod schema per table + composed shapes for embedded selects
src/api/        plain async functions: supabase.from(...) in, a parsed + typed row out
src/queries/    the useQuery / useMutation composables views actually call
```

**Zod is the trust boundary**, not a formality. Every response from Supabase is
`.parse()`d in `src/api/` before a component ever sees it — matched against real
PostgREST output (timestamp format, embed shape, nullability), not guessed from the
TypeScript types alone. A single malformed row is dropped and logged loudly rather than
blanking the whole list; a malformed single-row response (a mutation's result, a Realtime
patch) throws, because there is no list to gracefully shrink.

**The cache is in-memory only.** There is no persister and nothing is written to
`localStorage` — a hard page reload always starts empty and refetches. For a project whose
whole thesis is "we take this data's access boundary seriously," caching employee names
and leave reasons across browser sessions felt like the wrong trade, even for fictional
demo data. `queryClient.clear()` also runs on every sign-out, so a sign-out/sign-in cycle
on the same tab can never mix one account's cached data into another's.

**Realtime writes directly into the query cache.** `useLeaveRealtime()` (in
`src/queries/leave.ts`) subscribes to `postgres_changes` on `leave_requests` and, on each
event, fetches the single changed row and patches it into the `['leave-requests']` cache
entry with `queryClient.setQueryData` — no polling, no manually-reimplemented list state.
This is what makes the employee's page update the instant a manager decides.

**Pinia keeps exactly what Query cannot own:** the Supabase Auth session (driven by an
`onAuthStateChange` listener, not a fetch — though the profile row it loads is itself
routed through `queryClient.fetchQuery` so it shares the same cache a reactive read
would), and pure client UI state — which filters are active, which row is selected, which
dialog is open. None of that belongs in a server-data cache.

### Why an Edge Function

Creating an employee means creating an auth user, which a browser cannot do with a
publishable key. `create-employee` is the only privileged path in the product, and it
re-checks the caller's role **server-side against the `profiles` table** — a valid JWT is
not enough. If the profile or employee insert fails, it deletes the auth user it just
created rather than leaving an orphan.

### Data model

| Table | Purpose |
|---|---|
| `profiles` | Identity and the org hierarchy. `manager_id` is self-referencing. |
| `departments` | Five departments across Northlane Studio |
| `employees` | Employment record: title, status, start date, leave allowance |
| `leave_requests` | Type, dates, reason, status, decision and comment |
| `attendance_records` | Daily check-in / check-out, unique per employee per day |
| `documents` | Placeholder file metadata; files live in a private Storage bucket |

### How the boundary is actually built

Three layers, because RLS alone does not cover all of it:

1. **RLS policies decide which _rows_ you can touch.** Helper functions live in a
   `private` schema and are `SECURITY DEFINER`, so reading `profiles` from inside a
   `profiles` policy cannot recurse.
2. **Triggers decide which _columns_ you can change.** `profiles_update` lets you write
   your own row — which, without a guard, would let any employee set `role = 'admin'`.
   `guard_profile_self_update` refuses that with a `42501`. The same pattern limits an
   employee's self-edit to contact details only.
3. **A trigger stamps the decision.** `decided_by` is set server-side from `auth.uid()`,
   so it cannot be spoofed by the client, and a decided request cannot be re-opened or
   rewritten.

All of it is in `supabase/migrations/`, which is the authoritative record.

---

## Running it locally

```bash
git clone <this repo>
cd meridian
npm install

cp .env.example .env.local     # then fill in your Supabase URL + publishable key
npm run dev
```

Point it at your own Supabase project:

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push                      # schema, RLS, triggers, storage bucket
npx supabase functions deploy create-employee

SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  npm run seed
```

`npm run seed` is deterministic and re-runnable: it creates 25 Northlane Studio people
across 5 departments, roughly eight months of attendance, and a spread of pending,
approved and denied leave, so every view is populated on first load. The service-role key
is only ever used by that script, never by the app.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck and production build |
| `npm run typecheck` | `vue-tsc` only |
| `npm run test:e2e` | Playwright suite |
| `npm run test:api` | Postman collection via Newman |
| `npm run seed` | Seed / reset the demo dataset |
| `npm run test:perf` | LCP / CLS / interaction against a served build |
| `npm run shots` | Capture desktop + mobile screenshots to `shots/` |

---

## Design

Light-first throughout — no route uses a dark background as its default state.

The palette is cool sage-stone paper with a deep forest-pine accent and a brass
secondary, chosen so the colour carries the data model rather than decorating it: green
reads *approved*, brass reads *pending*, red reads *denied*. The nav sits on its own
deeper light layer so the shell has structural weight instead of floating on white.

Two typefaces, not three: **Schibsted Grotesk** for display and **Work Sans** for all UI
and data, with `tabular-nums` everywhere numbers are compared down a column. There is no
monospace face — employee IDs and dates need tabular *alignment*, not a monospace costume.

Every list row carries a 3px status stripe in its left gutter, spanning the full row
height with no rounding, so consecutive rows join into one unbroken vertical line. That
is the tagline made literal, and it is also the fastest way to scan 25 rows for the one
that needs attention.

Status is never carried by colour alone — every pill pairs a hue with a word and an icon,
so it survives greyscale and colour blindness.

---

## Notes and limitations

- **Northlane Studio is fictional.** Every person, department and record is generated
  demo data. Nothing here is real, and it should never hold real employee data — document
  uploads are placeholder files by design.
- `npm audit` reports vulnerabilities in the **`newman`** dependency tree. Newman is a
  dev-only test runner; none of it reaches the browser bundle.
- Not deployed. It runs locally against a live Supabase project.
- **Stretch items not built:** multi-level HR sign-off, CSV export, and a dark-mode
  toggle. The must-haves came first, and I would rather ship those solid than all of it
  half-done.
