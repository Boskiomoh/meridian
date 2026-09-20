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

interface Payload {
  full_name?: string
  email?: string
  title?: string
  department_id?: string | null
  start_date?: string
  role?: 'employee' | 'manager' | 'admin'
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

  if (callerErr) return json({ error: callerErr.message }, 500)
  if (!caller || caller.role !== 'admin') {
    return json({ error: 'Only an HR admin can add an employee.' }, 403)
  }

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Expected a JSON body.' }, 400)
  }

  const full_name = (body.full_name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const title = (body.title ?? '').trim()
  const start_date = body.start_date ?? ''
  const role = body.role ?? 'employee'

  if (!full_name) return json({ error: 'A full name is required.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid work email is required.' }, 400)
  if (!title) return json({ error: 'A job title is required.' }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) return json({ error: 'A start date is required.' }, 400)
  if (!['employee', 'manager', 'admin'].includes(role)) return json({ error: 'Unknown role.' }, 400)

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
    return json({ error: taken ? 'Someone already uses that email address.' : message }, taken ? 409 : 500)
  }

  const userId = created.user.id

  const { error: profileErr } = await admin.from('profiles').insert({
    id: userId,
    full_name,
    email,
    role,
    manager_id: body.manager_id ?? null,
  })

  if (profileErr) {
    // Do not leave an orphan auth user behind if the profile insert fails.
    await admin.auth.admin.deleteUser(userId)
    return json({ error: profileErr.message }, 500)
  }

  const { error: employeeErr } = await admin.from('employees').insert({
    id: userId,
    department_id: body.department_id ?? null,
    title,
    start_date,
    employment_status: 'active',
    leave_allowance_days: body.leave_allowance_days ?? 25,
  })

  if (employeeErr) {
    await admin.auth.admin.deleteUser(userId)
    return json({ error: employeeErr.message }, 500)
  }

  return json({ id: userId, full_name, email }, 201)
})
