import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://nptyyzyokzgnwnyteeyi.supabase.co";

/*
 * This is a public browser key. Database access remains protected by
 * Supabase Authentication and Row Level Security policies.
 */
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdHl5enlva3pnbndueXRlZXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTk1MjEsImV4cCI6MjA5OTc5NTUyMX0.i5IbW12V0oJKJs-nMqGjP8hfCEYTWmjMVeUuKI9PyS0";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
