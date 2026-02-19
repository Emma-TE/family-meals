import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gfpclnqvdorxweilnohc.supabase.co'
const supabaseAnonKey = 'sb_publishable_akrrFy6XYwAQllymFhyI8Q_KNTGV9F3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)