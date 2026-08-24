"use server";

// ============================================================
// SERVER ACTIONS — Gastos en Repuestos / Piezas
// app/actions/repuestos.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, GastoRepuesto } from "@/lib/types";

// -------------------------------------------------------
// Registrar un gasto en repuesto/pieza
// -------------------------------------------------------
export async function registrarGastoRepuestoAction(
  _prevState: ActionResult<GastoRepuesto>,
  formData: FormData
): Promise<ActionResult<GastoRepuesto>> {
  const supabase = await createSupabaseServerClient();

  // Obtener usuario actual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  // Extraer campos del formulario
  const unidadId = Number(formData.get("unidad_id"));
  const concepto = String(formData.get("concepto") ?? "").trim();
  const cantidad = Number(formData.get("cantidad"));
  const costoUnitario = Number(formData.get("costo_unitario"));
  const fechaCompra = String(formData.get("fecha_compra") ?? "");
  const proveedor = String(formData.get("proveedor") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim();

  // Validaciones
  if (!concepto) {
    return { success: false, error: "El concepto/nombre de la pieza es requerido." };
  }
  if (isNaN(cantidad) || cantidad <= 0) {
    return { success: false, error: "La cantidad debe ser un número positivo." };
  }
  if (isNaN(costoUnitario) || costoUnitario < 0) {
    return { success: false, error: "El costo unitario no puede ser negativo." };
  }
  if (!fechaCompra) {
    return { success: false, error: "La fecha de compra es requerida." };
  }

  const { data: gasto, error } = await supabase
    .from("gastos_repuestos")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      concepto,
      cantidad,
      costo_unitario: costoUnitario,
      fecha_compra: fechaCompra,
      proveedor: proveedor || null,
      notas: notas || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar el gasto: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: gasto as GastoRepuesto };
}

// -------------------------------------------------------
// Eliminar un gasto en repuesto (verificando que sea del usuario)
// -------------------------------------------------------
export async function eliminarGastoRepuestoAction(
  gastoId: number
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const { error } = await supabase
    .from("gastos_repuestos")
    .delete()
    .eq("id", gastoId)
    .eq("user_id", user.id); // RLS extra: solo borra los propios

  if (error) {
    return { success: false, error: `Error al eliminar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}
