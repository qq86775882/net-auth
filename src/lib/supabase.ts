import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// During SSR/build, NEXT_PUBLIC_ env vars may be unavailable.
// Use placeholders to prevent createClient from throwing; real data loads client-side.
const isSSR = typeof window === "undefined";
const safeUrl = supabaseUrl || (isSSR ? "https://placeholder.supabase.co" : "");
const safeKey = supabaseAnonKey || (isSSR ? "placeholder-key" : "");

export const supabase = createClient(safeUrl, safeKey);

// Server-side Supabase (for API Routes, using service_role key if available)
export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey);
};
