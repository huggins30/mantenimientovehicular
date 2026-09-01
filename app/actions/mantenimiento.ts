"use server";

// ============================================================
// SERVER ACTION — Registro unificado Repuesto + Mano de Obra
// app/actions/mantenimiento.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, RegistroMantenimiento } from "@/lib/types";

export async function registrarMantenimientoAction(
  _prevState: ActionResult<RegistroMantenimiento>,
  formData: FormData
): Promise<ActionResult<RegistroMantenimiento>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const unidadId       = Number(formData.get("unidad_id"));
  const fecha          = String(formData.get("fecha") ?? "");
  const proveedor      = String(formData.get("proveedor") ?? "").trim();
  const notas          = String(formData.get("notas") ?? "").trim();

  // ── Repuesto ────────────────────────────────────────────
  const repConcepto    = String(formData.get("rep_concepto") ?? "").trim();
  const repCantidad    = Number(formData.get("rep_cantidad"));
  const repCostoUnit   = Number(formData.get("rep_costo_unitario"));

  // ── Mano de Obra ────────────────────────────────────────
  const moConcepto     = String(formData.get("mo_concepto") ?? "").trim();
  const moCosto        = Number(formData.get("mo_costo"));

  // ── Tasa de Cambio ──────────────────────────────────────
  const tasaCambio     = Number(formData.get("tasa_cambio"));

  // ── Validaciones ────────────────────────────────────────
  if (!fecha)
    return { success: false, error: "La fecha es requerida." };
  if (!repConcepto)
    return { success: false, error: "El nombre de la pieza/repuesto es requerido." };
  if (isNaN(repCantidad) || repCantidad <= 0)
    return { success: false, error: "La cantidad debe ser mayor a 0." };
  if (isNaN(repCostoUnit) || repCostoUnit < 0)
    return { success: false, error: "El costo del repuesto no puede ser negativo." };
  if (!moConcepto)
    return { success: false, error: "El concepto de mano de obra es requerido." };
  if (isNaN(moCosto) || moCosto < 0)
    return { success: false, error: "El costo de mano de obra no puede ser negativo." };
  if (isNaN(tasaCambio) || tasaCambio <= 0)
    return { success: false, error: "La tasa de cambio debe ser mayor a 0." };

  // ── Insertar registro unificado ─────────────────────────
  const { data, error } = await supabase
    .from("registros_mantenimiento")
    .insert({
      user_id:           user.id,
      unidad_id:         unidadId,
      fecha,
      rep_concepto:      repConcepto,
      rep_cantidad:      repCantidad,
      rep_costo_unitario: repCostoUnit,
      mo_concepto:       moConcepto,
      mo_costo:          moCosto,
      tasa_cambio:       tasaCambio,
      proveedor:         proveedor || null,
      notas:             notas || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: data as RegistroMantenimiento };
}

export async function eliminarRegistroMantenimientoAction(
  id: number
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const { error } = await supabase
    .from("registros_mantenimiento")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: `Error al eliminar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}
