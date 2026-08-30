"use server";

// ============================================================
// SERVER ACTIONS — Administración de usuarios
// app/actions/admin.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import type { ActionResult, AdminUsuario } from "@/lib/types";

// -------------------------------------------------------
// Verificar si el usuario actual es administrador
// -------------------------------------------------------
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: perfil } = await supabaseAdmin
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  return perfil?.rol === "admin";
}

// -------------------------------------------------------
// Obtener el perfil del usuario actual
// -------------------------------------------------------
export async function getPerfilUsuario() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabaseAdmin
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return perfil;
}

// -------------------------------------------------------
// Listar todos los usuarios (solo para admin)
// Incluye conteo de unidades por usuario
// -------------------------------------------------------
export async function getUsuariosAdmin(): Promise<
  ActionResult<AdminUsuario[]>
> {
  const isAdmin = await isAdminUser();
  if (!isAdmin) {
    return { success: false, error: "Acceso denegado." };
  }

  // Obtener todos los perfiles
  const { data: perfiles, error } = await supabaseAdmin
    .from("perfiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      error: `Error al obtener usuarios: ${error.message}`,
    };
  }

  // Obtener conteo de unidades por usuario
  const { data: unidadesCount } = await supabaseAdmin
    .from("unidades")
    .select("user_id");

  // Construir mapa user_id → count
  const countMap: Record<string, number> = {};
  if (unidadesCount) {
    for (const u of unidadesCount) {
      countMap[u.user_id] = (countMap[u.user_id] ?? 0) + 1;
    }
  }

  const usuarios: AdminUsuario[] = (perfiles ?? []).map((p) => ({
    ...p,
    total_unidades: countMap[p.id] ?? 0,
  }));

  return { success: true, data: usuarios };
}

// -------------------------------------------------------
// Habilitar o deshabilitar un usuario
// -------------------------------------------------------
export async function toggleHabilitadoAction(
  userId: string,
  habilitado: boolean
): Promise<ActionResult> {
  const isAdmin = await isAdminUser();
  if (!isAdmin) {
    return { success: false, error: "Acceso denegado." };
  }

  const { error } = await supabaseAdmin
    .from("perfiles")
    .update({ habilitado })
    .eq("id", userId);

  if (error) {
    return {
      success: false,
      error: `Error al actualizar usuario: ${error.message}`,
    };
  }

  revalidatePath("/admin");
  return { success: true };
}

// -------------------------------------------------------
// Cambiar el límite de unidades de un usuario
// -------------------------------------------------------
export async function actualizarMaxUnidadesAction(
  userId: string,
  maxUnidades: number
): Promise<ActionResult> {
  const isAdmin = await isAdminUser();
  if (!isAdmin) {
    return { success: false, error: "Acceso denegado." };
  }

  if (maxUnidades < 0 || maxUnidades > 9999) {
    return {
      success: false,
      error: "El límite de unidades debe estar entre 0 y 9999.",
    };
  }

  const { error } = await supabaseAdmin
    .from("perfiles")
    .update({ max_unidades: maxUnidades })
    .eq("id", userId);

  if (error) {
    return {
      success: false,
      error: `Error al actualizar límite: ${error.message}`,
    };
  }

  revalidatePath("/admin");
  return { success: true };
}
