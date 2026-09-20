import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export type Tables = Database['public']['Tables']
export type Role = Database['public']['Enums']['user_role']
export type LeaveStatus = Database['public']['Enums']['leave_status']
export type LeaveType = Database['public']['Enums']['leave_type']
export type EmploymentStatus = Database['public']['Enums']['employment_status']
