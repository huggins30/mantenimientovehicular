// ============================================================
// CLIENTE SUPABASE — lib/supabase.ts
// Usa @supabase/ssr para soporte completo de App Router (cookies)
// ============================================================

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// -------------------------------------------------------
// Variables de entorno
// -------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// -------------------------------------------------------
// Cliente para Client Components ('use client')
// Singleton — reutiliza la misma instancia en el navegador
// -------------------------------------------------------
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// -------------------------------------------------------
// Cliente para Server Components, Server Actions y Route Handlers
// Lee/escribe cookies para mantener la sesión del usuario
// -------------------------------------------------------
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // En Server Components el setAll puede fallar —
          // está bien si ya se gestionó en el middleware.
        }
      },
    },
  });
}

// -------------------------------------------------------
// Cliente Admin (service role) — SOLO para Server Actions
// Sin restricciones de RLS — usar con precaución
// -------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey ?? supabaseAnonKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
