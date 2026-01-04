
import { createClient } from '@supabase/supabase-js';

// You can name these whatever you like in your environment.
// The engine will check for your preferred names first.
const supabaseUrl = (typeof process !== 'undefined' && (process.env.supabase_url || process.env.SUPABASE_URL)) 
  || 'https://lwwskuquymzsvattevgi.supabase.co';

const supabaseAnonKey = (typeof process !== 'undefined' && (process.env.supabase_key || process.env.SUPABASE_ANON_KEY)) 
  || 'sb_publishable_dCezHAB65w4FbXQkDyMcYg_jdvR3rM0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
