import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are missing or still using placeholder values
const isPlaceholder = supabaseUrl?.includes('YOUR_SUPABASE') || !supabaseUrl;

if (isPlaceholder) {
  console.warn('⚠️ Supabase credentials are missing or invalid. Please check your .env.development file.');
}

// We only try to create the client if we have a seemingly valid URL
// This prevents the "Uncaught Error: Invalid supabaseUrl" from crashing the app before we can show a warning
export const supabase = !isPlaceholder 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;


console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log(import.meta.env);