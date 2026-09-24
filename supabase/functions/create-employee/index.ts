// Meridian - create-employee
//
// Creating an employee means creating an auth user, which the browser cannot do
// with a publishable key. This function is the only privileged path in the
// product, so it re-checks the caller's role server-side: a valid JWT is not
// enough, the caller must actually be an HR admin. RLS protects the tables;
// this protects the admin API.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Payload {
  full_name?: string
  email?: string
  title?: string
  department_id?: string | null
  start_date?: string
  role?: string
  manager_id?: string | null
  leave_allowance_days?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Who is calling?
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: 'Not signed in.' }, 401)

  // Are they actually an admin? Checked against the table, not against a claim.
  const { data: caller, error: callerErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (callerErr) {
    console.error('create-employee: role lookup failed', callerErr.message)
    return json({ error: 'Could not check your access. Try again.' }, 500)
  }
  if (!caller || caller.role !== 'admin') {
    return json({ error: 'Only an HR admin can add an employee.' }, 403)
  }

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Expected a JSON body.' }, 400)
  }

  if (!body || typeof body !== 'object') return json({ error: 'Expected a JSON object.' }, 400)

  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  const full_name = text(body.full_name)
  const email = text(body.email).toLowerCase()
  const title = text(body.title)
  const start_date = text(body.start_date)
  const role = body.role ?? 'employee'
  const department_id = body.department_id ?? null
  const manager_id = body.manager_id ?? null
  const leave_allowance_days = body.leave_allowance_days ?? 25

  if (!full_name || full_name.length > 120) return json({ error: 'A full name (up to 120 characters) is required.' }, 400)
  // The demo only ever holds fictional people: work emails stay on the fictional domain, so the
  // public admin login can't be used to register real addresses.
  if (email.length > 254 || !/^[a-z0-9._+-]+@northlane\.studio$/.test(email)) {
    return json({ error: 'Use a work email ending in @northlane.studio.' }, 400)
  }
  if (!title || title.length > 120) return json({ error: 'A job title (up to 120 characters) is required.' }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || Number.isNaN(Date.parse(start_date))) {
    return json({ error: 'A start date is required.' }, 400)
  }
  if (!['employee', 'manager', 'admin'].includes(role)) return json({ error: 'Unknown role.' }, 400)
  if (department_id !== null && !UUID.test(String(department_id))) return json({ error: 'Unknown department.' }, 400)
  if (manager_id !== null && !UUID.test(String(manager_id))) return json({ error: 'Unknown manager.' }, 400)
  if (!Number.isInteger(leave_allowance_days) || leave_allowance_days < 0 || leave_allowance_days > 365) {
    return json({ error: 'Leave allowance must be a whole number of days from 0 to 365.' }, 400)
  }

  // A demo system must never hold a real password anyone chose.
  const password = `Nl-${crypto.randomUUID().slice(0, 18)}!7`

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createErr || !created.user) {
    const message = createErr?.message ?? 'Could not create the account.'
    const taken = /already|registered|exists/i.test(message)
    if (!taken) console.error('create-employee: createUser failed', message)
    return json({ error: taken ? 'Someone already uses that email address.' : 'Could not create the account.' }, taken ? 409 : 500)
  }

  const userId = created.user.id

  const { error: profileErr } = await admin.from('profiles').insert({
    id: userId,
    full_name,
    email,
    role,
    manager_id,
  })

  if (profileErr) {
    // Do not leave an orphan auth user behind if the profile insert fails.
    await admin.auth.admin.deleteUser(userId)
    console.error('create-employee: profile insert failed', profileErr.message)
    return json({ error: profileErr.code === '23503' ? 'That manager does not exist.' : 'Could not create the profile.' }, profileErr.code === '23503' ? 400 : 500)
  }

  const { error: employeeErr } = await admin.from('employees').insert({
    id: userId,
    department_id,
    title,
    start_date,
    employment_status: 'active',
    leave_allowance_days,
  })

  if (employeeErr) {
    await admin.auth.admin.deleteUser(userId)
    console.error('create-employee: employee insert failed', employeeErr.message)
    return json({ error: employeeErr.code === '23503' ? 'That department does not exist.' : 'Could not create the employee record.' }, employeeErr.code === '23503' ? 400 : 500)
  }

  return json({ id: userId, full_name, email }, 201)
})
