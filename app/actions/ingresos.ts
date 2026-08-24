"use server";

// ============================================================
// SERVER ACTIONS — Ingresos de la Unidad
// app/actions/ingresos.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, IngresoUnidad } from "@/lib/types";

// -------------------------------------------------------
// Registrar un nuevo ingreso
// -------------------------------------------------------
export async function registrarIngresoAction(
  _prevState: ActionResult<IngresoUnidad>,
  formData: FormData
): Promise<ActionResult<IngresoUnidad>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const unidadId = Number(formData.get("unidad_id"));
  const concepto = String(formData.get("concepto") ?? "").trim();
  const montoIngreso = Number(formData.get("monto_ingreso"));
  const fecha = String(formData.get("fecha") ?? "");
  const comprobante = String(formData.get("comprobante") ?? "").trim();

  if (!concepto) {
    return { success: false, error: "El concepto (motivo del ingreso) es requerido." };
  }
  if (isNaN(montoIngreso) || montoIngreso <= 0) {
    return { success: false, error: "El monto debe ser un número positivo mayor a cero." };
  }
  if (!fecha) {
    return { success: false, error: "La fecha del ingreso es requerida." };
  }

  const { data: ingreso, error } = await supabase
    .from("ingresos_unidad")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      concepto,
      monto_ingreso: montoIngreso,
      fecha,
      comprobante: comprobante || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar el ingreso: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: ingreso as IngresoUnidad };
}

// -------------------------------------------------------
// Eliminar un ingreso
// -------------------------------------------------------
export async function eliminarIngresoAction(
  ingresoId: number
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const { error } = await supabase
    .from("ingresos_unidad")
    .delete()
    .eq("id", ingresoId)
    .eq("user_id", user.id); // Protección RLS y user match

  if (error) {
    return { success: false, error: `Error al eliminar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}
