import { supabase } from '@/lib/supabase'
import { parseRows } from '@/lib/parseRows'
import { documentRowSchema, type DocumentRow } from '@/schemas'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain']

export async function fetchDocuments(employeeId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, employee_id, storage_path, file_name, uploaded_at')
    .eq('employee_id', employeeId)
    .order('uploaded_at', { ascending: false })

  if (error) throw new Error(error.message)
  return parseRows(documentRowSchema, data ?? [], 'fetchDocuments')
}

export async function uploadDocument(employeeId: string, file: File): Promise<void> {
  if (file.size > MAX_BYTES) throw new Error('That file is larger than 5 MB.')
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Upload a PDF, PNG, JPEG or plain text file.')
  }

  // The first path segment is the owner id, which is what the storage policy
  // checks -- so a file can only ever be written into its own folder.
  const safeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120)
  const path = `${employeeId}/${Date.now()}-${safeName}`

  const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file)
  if (uploadErr) throw new Error(uploadErr.message)

  const { error: rowErr } = await supabase.from('documents').insert({
    employee_id: employeeId,
    storage_path: path,
    file_name: safeName,
  })

  if (rowErr) {
    // Do not leave an orphan object in the bucket.
    await supabase.storage.from('documents').remove([path])
    throw new Error(rowErr.message)
  }
}

export async function deleteDocument(doc: { id: string; storage_path: string }): Promise<void> {
  const { error: rowErr } = await supabase.from('documents').delete().eq('id', doc.id)
  if (rowErr) throw new Error(rowErr.message)
  await supabase.storage.from('documents').remove([doc.storage_path])
}

export async function getDocumentSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
