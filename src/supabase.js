// src/supabase.js: connects the site to your Supabase project.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// If .env.local is missing, supabase is null and the site uses its backup list instead of crashing.
export const supabase = url && key ? createClient(url, key) : null
