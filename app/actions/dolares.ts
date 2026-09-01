"use server";

// ============================================================
// SERVER ACTIONS — Compra de Dólares
// app/actions/dolares.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, ComprasDolares } from "@/lib/types";

// -------------------------------------------------------
// Registrar una compra de dólares
// -------------------------------------------------------
export async function registrarCompraDolaresAction(
  _prevState: ActionResult<ComprasDolares>,
  formData: FormData
): Promise<ActionResult<ComprasDolares>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const unidadId       = Number(formData.get("unidad_id"));
  const fecha          = String(formData.get("fecha") ?? "");
  const cantidadDolares = Number(formData.get("cantidad_dolares"));
  const tasaCambio     = Number(formData.get("tasa_cambio"));
  const notas          = String(formData.get("notas") ?? "").trim();

  // Validaciones
  if (!fecha) return { success: false, error: "La fecha es requerida." };
  if (isNaN(cantidadDolares) || cantidadDolares <= 0)
    return { success: false, error: "La cantidad de dólares debe ser mayor a 0." };
  if (isNaN(tasaCambio) || tasaCambio <= 0)
    return { success: false, error: "La tasa de cambio debe ser mayor a 0." };


  const { data, error } = await supabase
    .from("compras_dolares")
    .insert({
      user_id:          user.id,
      unidad_id:        unidadId,
      fecha,
      cantidad_dolares: cantidadDolares,
      tasa_cambio:      tasaCambio,
      notas:            notas || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: data as ComprasDolares };
}

// -------------------------------------------------------
// Eliminar una compra de dólares
// -------------------------------------------------------
export async function eliminarCompraDolaresAction(
  id: number
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const { error } = await supabase
    .from("compras_dolares")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: `Error al eliminar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}

// -------------------------------------------------------
// Obtener compras de dólares por unidad
// -------------------------------------------------------
export async function getComprasDolaresByUnidad(
  unidadId: number
): Promise<ComprasDolares[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("compras_dolares")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("fecha", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data ?? []) as ComprasDolares[];
}
