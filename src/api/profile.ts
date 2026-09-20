import { supabase } from '@/lib/supabase'
import { parseRow } from '@/lib/parseRows'
import { profileSchema, type Profile } from '@/schemas'

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Profile not found.')
  return parseRow(profileSchema, data, 'fetchProfile')
}
