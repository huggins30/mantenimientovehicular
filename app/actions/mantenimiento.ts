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

  // ── Repuestos (Múltiples piezas o individual) ────────────
  const piezasJson     = formData.get("piezas_json") as string | null;
  let repConcepto      = String(formData.get("rep_concepto") ?? "").trim();
  let repCantidad      = Number(formData.get("rep_cantidad") || 1);
  let repCostoUnitUSD  = Number(formData.get("rep_costo_unitario") || 0);
  let repCostoUnitBs   = Number(formData.get("rep_costo_unitario_bs") || 0);

  // ── Mano de Obra ────────────────────────────────────────
  const moConcepto     = String(formData.get("mo_concepto") ?? "").trim();
  const moCostoUSD     = Number(formData.get("mo_costo") || 0);
  const moCostoBs      = Number(formData.get("mo_costo_bs") || 0);

  // ── Tasa de Cambio ──────────────────────────────────────
  const tasaCambio     = Number(formData.get("tasa_cambio"));

  // ── Validaciones Generales ──────────────────────────────
  if (!fecha)
    return { success: false, error: "La fecha es requerida." };
  if (!moConcepto)
    return { success: false, error: "El concepto de mano de obra es requerido." };
  if (isNaN(moCostoUSD) || moCostoUSD < 0)
    return { success: false, error: "El costo de mano de obra en dólares no puede ser negativo." };
  if (isNaN(moCostoBs) || moCostoBs < 0)
    return { success: false, error: "El costo de mano de obra en bolívares no puede ser negativo." };
  if (isNaN(tasaCambio) || tasaCambio <= 0)
    return { success: false, error: "La tasa de cambio debe ser mayor a 0." };

  let repSubtotalUSD = 0;

  if (piezasJson) {
    try {
      const piezasList = JSON.parse(piezasJson) as Array<{
        concepto: string;
        cantidad: number | string;
        costoUSD: string;
        costoBs: string;
      }>;

      if (piezasList.length > 0) {
        const nombresValidos = piezasList
          .filter((p) => p.concepto.trim() !== "")
          .map((p) => {
            const cant = Math.max(1, parseInt(String(p.cantidad)) || 1);
            return cant > 1 ? `${p.concepto.trim()} (x${cant})` : p.concepto.trim();
          });

        if (nombresValidos.length === 0) {
          return { success: false, error: "Debe ingresar el nombre de al menos una pieza." };
        }

        repConcepto = nombresValidos.join(", ");
        let totalCount = 0;
        let totalUSD = 0;

        for (const p of piezasList) {
          if (!p.concepto.trim()) continue;
          const cant = Math.max(1, parseInt(String(p.cantidad)) || 1);
          const cUSD = parseFloat(p.costoUSD) || 0;
          const cBs = parseFloat(p.costoBs) || 0;
          const unitUSD = cUSD + (tasaCambio > 0 && cBs > 0 ? cBs / tasaCambio : 0);
          totalUSD += cant * unitUSD;
          totalCount += cant;
        }

        repCantidad = totalCount > 0 ? totalCount : 1;
        repSubtotalUSD = totalUSD;
      }
    } catch {
      // Si falla el parse, continuará con los campos individuales
    }
  }

  // Si no se procesó por piezasJson, usar campos individuales
  if (repSubtotalUSD === 0 && !piezasJson) {
    if (!repConcepto)
      return { success: false, error: "El nombre de la pieza/repuesto es requerido." };
    if (isNaN(repCantidad) || repCantidad <= 0)
      return { success: false, error: "La cantidad debe ser mayor a 0." };
    if (isNaN(repCostoUnitUSD) || repCostoUnitUSD < 0)
      return { success: false, error: "El costo del repuesto en dólares no puede ser negativo." };
    if (isNaN(repCostoUnitBs) || repCostoUnitBs < 0)
      return { success: false, error: "El costo del repuesto en bolívares no puede ser negativo." };

    const repUnitUSD = repCostoUnitUSD + (tasaCambio > 0 && repCostoUnitBs > 0 ? repCostoUnitBs / tasaCambio : 0);
    repSubtotalUSD = repCantidad * repUnitUSD;
  }

  // Conversión de Mano de Obra
  const moUSD = moCostoUSD + (tasaCambio > 0 && moCostoBs > 0 ? moCostoBs / tasaCambio : 0);

  if (repSubtotalUSD <= 0 && moUSD <= 0) {
    return { success: false, error: "Debe ingresar un monto en dólares o bolívares para las piezas o la mano de obra." };
  }

  const repUnitUSD = repCantidad > 0 ? repSubtotalUSD / repCantidad : 0;

  // ── Insertar registro unificado ─────────────────────────
  const totalCostoUSD  = repSubtotalUSD + moUSD;
  const costoBolivares = tasaCambio > 0 ? Number((totalCostoUSD * tasaCambio).toFixed(2)) : null;

  const { data, error } = await supabase
    .from("registros_mantenimiento")
    .insert({
      user_id:           user.id,
      unidad_id:         unidadId,
      fecha,
      rep_concepto:      repConcepto,
      rep_cantidad:      repCantidad,
      rep_costo_unitario: Number(repUnitUSD.toFixed(2)),
      mo_concepto:       moConcepto,
      mo_costo:          Number(moUSD.toFixed(2)),
      tasa_cambio:       tasaCambio,
      costo_bolivares:   costoBolivares,
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
