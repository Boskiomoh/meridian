/**
 * Meridian seed - Northlane Studio.
 *
 * Creates 25 auth users + profiles/employees across 5 departments, ~3 months of
 * attendance, and a spread of pending/approved/denied leave. Runs with the service
 * role key so it bypasses RLS; never ship that key to the browser.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } })

export const DEMO_PASSWORD = 'Northlane!2026'

const DEPARTMENTS = ['Design', 'Engineering', 'Client Services', 'Operations', 'Marketing']

// reports_to is a key into this same list; resolved to a uuid once users exist.
const PEOPLE = [
  { key: 'priya',    name: 'Priya Raghunathan',  dept: 'Operations',      title: 'People Operations Lead',  role: 'admin',    reports_to: null,     start: '2021-02-15', status: 'active', demo: true },

  { key: 'tobias',   name: 'Tobias Lind',        dept: 'Design',          title: 'Design Director',         role: 'manager',  reports_to: 'priya',  start: '2021-06-01', status: 'active', demo: true },
  { key: 'samuel',   name: 'Samuel Adeyemi',     dept: 'Engineering',     title: 'Engineering Manager',     role: 'manager',  reports_to: 'priya',  start: '2020-09-14', status: 'active' },
  { key: 'nadia',    name: 'Nadia Haddad',       dept: 'Client Services', title: 'Client Services Manager', role: 'manager',  reports_to: 'priya',  start: '2022-01-10', status: 'active' },
  { key: 'elena',    name: 'Elena Vasquez',      dept: 'Marketing',       title: 'Marketing Manager',       role: 'manager',  reports_to: 'priya',  start: '2022-03-07', status: 'active' },

  { key: 'maya',     name: 'Maya Okonkwo',       dept: 'Design',          title: 'Product Designer',        role: 'employee', reports_to: 'tobias', start: '2023-04-03', status: 'active', demo: true },
  { key: 'idris',    name: 'Idris Bello',        dept: 'Design',          title: 'Senior Brand Designer',   role: 'employee', reports_to: 'tobias', start: '2022-08-22', status: 'active' },
  { key: 'hanna',    name: 'Hanna Vestergaard',  dept: 'Design',          title: 'Motion Designer',         role: 'employee', reports_to: 'tobias', start: '2024-01-08', status: 'active' },
  { key: 'rui',      name: 'Rui Alcantara',      dept: 'Design',          title: 'UX Researcher',           role: 'employee', reports_to: 'tobias', start: '2023-11-13', status: 'on_leave' },

  { key: 'lena',     name: 'Lena Kowalski',      dept: 'Engineering',     title: 'Senior Frontend Engineer', role: 'employee', reports_to: 'samuel', start: '2021-10-04', status: 'active' },
  { key: 'arjun',    name: 'Arjun Mehta',        dept: 'Engineering',     title: 'Backend Engineer',        role: 'employee', reports_to: 'samuel', start: '2023-02-20', status: 'active' },
  { key: 'chiamaka', name: 'Chiamaka Nwosu',     dept: 'Engineering',     title: 'QA Engineer',             role: 'employee', reports_to: 'samuel', start: '2023-07-17', status: 'active' },
  { key: 'felix',    name: 'Felix Brenner',      dept: 'Engineering',     title: 'Platform Engineer',       role: 'employee', reports_to: 'samuel', start: '2022-05-09', status: 'active' },
  { key: 'sofia',    name: 'Sofia Marchetti',    dept: 'Engineering',     title: 'Mobile Engineer',         role: 'employee', reports_to: 'samuel', start: '2024-03-04', status: 'active' },

  { key: 'oliver',   name: 'Oliver Grant',       dept: 'Client Services', title: 'Account Manager',         role: 'employee', reports_to: 'nadia',  start: '2022-04-11', status: 'active' },
  { key: 'thandiwe', name: 'Thandiwe Mokoena',   dept: 'Client Services', title: 'Project Manager',         role: 'employee', reports_to: 'nadia',  start: '2021-11-29', status: 'active' },
  { key: 'jonas',    name: 'Jonas Weber',        dept: 'Client Services', title: 'Client Partner',          role: 'employee', reports_to: 'nadia',  start: '2023-09-18', status: 'active' },
  { key: 'amara',    name: 'Amara Diallo',       dept: 'Client Services', title: 'Producer',                role: 'employee', reports_to: 'nadia',  start: '2024-02-05', status: 'active' },

  { key: 'marcus',   name: 'Marcus Bell',        dept: 'Operations',      title: 'Facilities Coordinator',  role: 'employee', reports_to: 'priya',  start: '2022-07-25', status: 'active' },
  { key: 'yuki',     name: 'Yuki Tanaka',        dept: 'Operations',      title: 'Finance Analyst',         role: 'employee', reports_to: 'priya',  start: '2023-01-16', status: 'active' },
  { key: 'ingrid',   name: 'Ingrid Sorensen',    dept: 'Operations',      title: 'Operations Coordinator',  role: 'employee', reports_to: 'priya',  start: '2021-08-30', status: 'deactivated' },

  { key: 'caleb',    name: 'Caleb Osei',         dept: 'Marketing',       title: 'Content Strategist',      role: 'employee', reports_to: 'elena',  start: '2023-05-22', status: 'active' },
  { key: 'meilin',   name: 'Mei Lin Chen',       dept: 'Marketing',       title: 'Growth Marketer',         role: 'employee', reports_to: 'elena',  start: '2022-10-10', status: 'active' },
  { key: 'tomas',    name: 'Tomas Ferreira',     dept: 'Marketing',       title: 'Social Media Lead',       role: 'employee', reports_to: 'elena',  start: '2023-03-13', status: 'active' },
  { key: 'zara',     name: 'Zara Ahmed',         dept: 'Marketing',       title: 'Marketing Coordinator',   role: 'employee', reports_to: 'elena',  start: '2024-06-03', status: 'active' },
]

const CITIES = ['Lisbon', 'Berlin', 'Lagos', 'Manchester', 'Rotterdam', 'Krakow', 'Dublin']

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
    .split(/\s+/)
    .join('.')

const emailFor = (name) => slug(name) + '@northlane.studio'

// Deterministic PRNG so re-seeding reproduces the same dataset.
let _s = 20260916
const rnd = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const intBetween = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const iso = (d) => d.toISOString().slice(0, 10)

// "today" for the dataset, so charts and queues look alive on first load.
const TODAY = () => new Date(Date.UTC(2026, 8, 16))

async function main() {
  console.log('-> departments')
  const { data: depts, error: deptErr } = await db
    .from('departments')
    .upsert(DEPARTMENTS.map((name) => ({ name })), { onConflict: 'name' })
    .select()
  if (deptErr) throw deptErr
  const deptId = Object.fromEntries(depts.map((d) => [d.name, d.id]))

  // Reset: the E2E suite creates real employees (it has to -- that is the point
  // of the "admin can create an employee" spec). Without this, every test run
  // leaves a deactivated fixture behind and the directory slowly fills with
  // them. Anyone not in PEOPLE is not part of Northlane Studio.
  console.log('-> removing anyone not in the roster')
  {
    const expected = new Set(PEOPLE.map((p) => emailFor(p.name)))
    const { data: list, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error

    const strays = list.users.filter((u) => u.email && !expected.has(u.email))
    for (const stray of strays) {
      const { error: delErr } = await db.auth.admin.deleteUser(stray.id)
      if (delErr) throw delErr
      process.stdout.write('-')
    }
    console.log(strays.length ? ` ${strays.length} removed` : ' none')
  }

  console.log('-> auth users')
  const ids = {}
  for (const p of PEOPLE) {
    const email = emailFor(p.name)
    const password = p.demo ? DEMO_PASSWORD : 'Nl-' + Math.random().toString(36).slice(2, 12) + '!7'
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: p.name },
    })
    if (error) {
      if (!/already|registered|exists/i.test(error.message)) throw error
      const { data: list, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (listErr) throw listErr
      const found = list.users.find((u) => u.email === email)
      if (!found) throw error
      ids[p.key] = found.id
      process.stdout.write('.')
      continue
    }
    ids[p.key] = data.user.id
    process.stdout.write('+')
  }
  console.log('')

  console.log('-> profiles')
  // Two passes: every row must exist before manager_id can point at one.
  const profiles = PEOPLE.map((p) => ({
    id: ids[p.key],
    full_name: p.name,
    email: emailFor(p.name),
    role: p.role,
    manager_id: null,
  }))
  const { error: profErr } = await db.from('profiles').upsert(profiles, { onConflict: 'id' })
  if (profErr) throw profErr

  for (const p of PEOPLE.filter((x) => x.reports_to)) {
    const { error } = await db
      .from('profiles')
      .update({ manager_id: ids[p.reports_to] })
      .eq('id', ids[p.key])
    if (error) throw error
  }

  console.log('-> employees')
  const employees = PEOPLE.map((p) => ({
    id: ids[p.key],
    department_id: deptId[p.dept],
    title: p.title,
    employment_status: p.status,
    start_date: p.start,
    phone: '+44 7' + intBetween(100, 999) + ' ' + intBetween(100000, 999999),
    location: pick(CITIES),
    leave_allowance_days: p.role === 'admin' ? 30 : p.role === 'manager' ? 28 : 25,
  }))
  const { error: empErr } = await db.from('employees').upsert(employees, { onConflict: 'id' })
  if (empErr) throw empErr

  console.log('-> leave requests')
  // Leave is inserted (not upserted) because ids are generated, so clear first to
  // keep re-runs idempotent rather than stacking duplicate history.
  const { error: clearErr } = await db
    .from('leave_requests')
    .delete()
    .gte('created_at', '1970-01-01')
  if (clearErr) throw clearErr

  const TYPES = ['vacation', 'sick', 'personal', 'other']
  const REASONS = {
    vacation: [
      'Family holiday, flights already booked.',
      'Two weeks away with my partner.',
      'Taking the last of my carry-over days.',
    ],
    sick: [
      'Chest infection, GP signed me off.',
      'Migraine, cannot look at a screen.',
      'Recovering from a minor procedure.',
    ],
    personal: ['Moving flat.', 'Family matter I need to be there for.', 'Attending a wedding abroad.'],
    other: ['Conference: Design Matters, Amsterdam.', 'Jury duty.', 'Volunteering day.'],
  }
  const COMMENTS = {
    approved: [
      'Covered by the rest of the team, enjoy.',
      'Fine, handover noted.',
      'Approved, sprint capacity already adjusted.',
    ],
    denied: [
      'Clashes with the client launch week, please refile for later.',
      'Two others are already off those dates.',
      'We need you for the QBR, sorry.',
    ],
  }

  const leave = []
  const staff = PEOPLE.filter((p) => p.status !== 'deactivated')
  for (const p of staff) {
    const count = intBetween(2, 5)
    for (let n = 0; n < count; n++) {
      const type = pick(TYPES)
      const startOffset = intBetween(-240, 45)
      const start = TODAY()
      start.setUTCDate(start.getUTCDate() + startOffset)
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + (type === 'sick' ? intBetween(0, 3) : intBetween(2, 11)))

      // Past requests were decided; future ones are mostly still in the queue.
      const status = startOffset < 0
        ? (rnd() > 0.25 ? 'approved' : 'denied')
        : (rnd() > 0.55 ? 'approved' : 'pending')
      const decider = p.reports_to ? ids[p.reports_to] : ids.priya
      const decidedAt = new Date(start)
      decidedAt.setUTCDate(decidedAt.getUTCDate() - intBetween(3, 14))

      leave.push({
        employee_id: ids[p.key],
        type,
        start_date: iso(start),
        end_date: iso(end),
        reason: pick(REASONS[type]),
        status,
        decided_by: status === 'pending' ? null : decider,
        decided_at: status === 'pending' ? null : decidedAt.toISOString(),
        comment: status === 'pending' ? null : pick(COMMENTS[status]),
      })
    }
  }

  // Guarantee the demo employee has one pending request in their manager's queue,
  // so the walkthrough (submit -> approve -> live update) always has something to act on.
  leave.push({
    employee_id: ids.maya,
    type: 'vacation',
    start_date: '2026-10-12',
    end_date: '2026-10-23',
    reason: 'Two weeks in Lagos for my sister\'s wedding.',
    status: 'pending',
    decided_by: null,
    decided_at: null,
    comment: null,
  })

  const { error: leaveErr } = await db.from('leave_requests').insert(leave)
  if (leaveErr) throw leaveErr
  console.log('   ' + leave.length + ' rows')

  // Eight months, so the six-month analytics window is fully covered and the
  // charts do not open on empty months.
  const ATTENDANCE_DAYS = 250
  console.log(`-> attendance (${ATTENDANCE_DAYS} days)`)
  const approvedLeave = leave.filter((l) => l.status === 'approved')
  const onApprovedLeave = (empId, day) =>
    approvedLeave.some((l) => l.employee_id === empId && day >= l.start_date && day <= l.end_date)

  const attendance = []
  for (const p of staff) {
    for (let back = ATTENDANCE_DAYS; back >= 1; back--) {
      const d = TODAY()
      d.setUTCDate(d.getUTCDate() - back)
      const dow = d.getUTCDay()
      if (dow === 0 || dow === 6) continue
      const day = iso(d)
      if (onApprovedLeave(ids[p.key], day)) continue
      if (rnd() < 0.04) continue // unrecorded day, so the attendance rate is not a flat 100%

      const checkIn = new Date(d)
      checkIn.setUTCHours(8, intBetween(38, 75), intBetween(0, 59), 0) // ~08:38-09:55
      const checkOut = new Date(d)
      checkOut.setUTCHours(16, intBetween(55, 130), intBetween(0, 59), 0) // ~16:55-18:10

      attendance.push({
        employee_id: ids[p.key],
        date: day,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
      })
    }
  }

  for (let i = 0; i < attendance.length; i += 500) {
    const { error } = await db
      .from('attendance_records')
      .upsert(attendance.slice(i, i + 500), { onConflict: 'employee_id,date' })
    if (error) throw error
    process.stdout.write('.')
  }
  console.log('\n   ' + attendance.length + ' rows')

  console.log('\nDemo logins (password: ' + DEMO_PASSWORD + ')')
  for (const p of PEOPLE.filter((x) => x.demo)) {
    console.log('  ' + p.role.padEnd(8) + ' ' + emailFor(p.name) + '  - ' + p.name + ', ' + p.title)
  }
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message ?? e)
  process.exit(1)
})
