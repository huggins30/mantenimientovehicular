"use server";

// ============================================================
// SERVER ACTIONS — Autenticación con Supabase Auth
// app/actions/auth.ts
// ============================================================

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
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
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      success: false,
      error: error.message === "Invalid login credentials"
        ? "Credenciales inválidas. Verifica tu email y contraseña."
        : `Error al iniciar sesión: ${error.message}`,
    };
  }

  // Verificar si el usuario está habilitado por el administrador
  if (signInData?.user) {
    const { data: perfil } = await supabaseAdmin
      .from("perfiles")
      .select("habilitado, rol")
      .eq("id", signInData.user.id)
      .single();

    if (perfil && !perfil.habilitado) {
      // Cerrar sesión y redirigir a página de espera
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Tu cuenta aún no ha sido habilitada. Contacta al administrador.",
      };
    }

    if (perfil?.rol === "admin") {
      revalidatePath("/", "layout");
      redirect("/admin");
    }
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

  // Usar supabaseAdmin para auto-confirmar el correo (evita que el usuario tenga que verificar su email)
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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
