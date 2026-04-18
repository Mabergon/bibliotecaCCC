import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Aquest client és el substitut de createClientComponentClient
// i activa automàticament el flux PKCE (el que NO té el #)
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)