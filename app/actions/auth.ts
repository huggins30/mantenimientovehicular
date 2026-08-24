"use server";

// ============================================================
// SERVER ACTIONS — Autenticación con Supabase Auth
// app/actions/auth.ts
// ============================================================

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult } from "@/lib/types";

// -------------------------------------------------------
// Iniciar sesión con email + contraseña
// -------------------------------------------------------
export async function signInAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email y contraseña son requeridos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      success: false,
      error: error.message === "Invalid login credentials"
        ? "Credenciales inválidas. Verifica tu email y contraseña."
        : `Error al iniciar sesión: ${error.message}`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// -------------------------------------------------------
// Registrar nuevo usuario
// -------------------------------------------------------
export async function signUpAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email y contraseña son requeridos." };
  }

  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas no coinciden." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: `Error al registrarse: ${error.message}`,
    };
  }

  return {
    success: true,
    data: undefined,
  };
}

// -------------------------------------------------------
// Cerrar sesión
// -------------------------------------------------------
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
