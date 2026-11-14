"use server";

// ============================================================
// SERVER ACTIONS — Otros Egresos
// app/actions/otros_egresos.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, OtroEgreso } from "@/lib/types";

// -------------------------------------------------------
// Registrar un nuevo egreso en "Otros Egresos"
// -------------------------------------------------------
export async function registrarOtroEgresoAction(
  _prevState: ActionResult<OtroEgreso>,
  formData: FormData
): Promise<ActionResult<OtroEgreso>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const rawUnidadId = formData.get("unidad_id");
  const unidadId   = rawUnidadId ? Number(rawUnidadId) : null;
  const concepto   = String(formData.get("concepto") ?? "").trim();
  const tipoMoneda = String(formData.get("tipo_moneda") ?? "USD").trim() as "USD" | "BS";
  const montoUsd   = Number(formData.get("monto_usd"))  || 0;
  const montoBs    = Number(formData.get("monto_bs"))   || 0;
  const fecha      = String(formData.get("fecha") ?? "").trim();
  const notas      = String(formData.get("notas") ?? "").trim() || null;
  const financiado = formData.get("financiado") === "true";

  // Validaciones
  if (!unidadId || isNaN(unidadId)) {
    return { success: false, error: "Debes seleccionar una unidad para registrar el egreso." };
  }
  if (!concepto) {
    return { success: false, error: "El concepto es requerido." };
  }
  if (!fecha) {
    return { success: false, error: "La fecha es requerida." };
  }
  // Solo validar monto si NO está financiado
  if (!financiado) {
    if (tipoMoneda === "USD" && montoUsd <= 0) {
      return { success: false, error: "El monto en dólares debe ser mayor a cero." };
    }
    if (tipoMoneda === "BS" && montoBs <= 0) {
      return { success: false, error: "El monto en bolívares debe ser mayor a cero." };
    }
  }

  const { data, error } = await supabase
    .from("otros_egresos")
    .insert({
      user_id:     user.id,
      unidad_id:   unidadId,
      concepto,
      tipo_moneda: tipoMoneda,
      monto_usd:   financiado ? 0 : (tipoMoneda === "USD" ? montoUsd : 0),
      monto_bs:    financiado ? 0 : (tipoMoneda === "BS"  ? montoBs  : 0),
      fecha,
      notas,
      financiado,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message.includes("does not exist")
        ? "La tabla 'otros_egresos' no existe. Ejecuta el script SQL primero."
        : `Error al registrar: ${error.message}`,
    };
  }

  revalidatePath("/");
  return { success: true, data: data as OtroEgreso };
}

// -------------------------------------------------------
// Obtener todos los otros egresos del usuario
// -------------------------------------------------------
export async function getOtrosEgresos(filter?: {
  unidadId?: number;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
}): Promise<OtroEgreso[]> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("otros_egresos")
    .select("*")
    .eq("user_id", user.id)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter?.unidadId) {
    query = query.eq("unidad_id", filter.unidadId);
  }

  if (filter?.fecha) {
    query = query.eq("fecha", filter.fecha);
  } else {
    if (filter?.fechaInicio) query = query.gte("fecha", filter.fechaInicio);
    if (filter?.fechaFin)    query = query.lte("fecha", filter.fechaFin);
  }

  const { data } = await query;
  return (data ?? []) as OtroEgreso[];
}

// -------------------------------------------------------
// Eliminar un otro egreso
// -------------------------------------------------------
export async function eliminarOtroEgresoAction(
  id: number
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado." };

  const { error } = await supabase
    .from("otros_egresos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

