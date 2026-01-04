
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwwskuquymzsvattevgi.supabase.co';
const supabaseAnonKey = 'sb_publishable_dCezHAB65w4FbXQkDyMcYg_jdvR3rM0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
