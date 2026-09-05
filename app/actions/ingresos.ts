"use server";

// ============================================================
// SERVER ACTIONS — Ingresos de la Unidad
// app/actions/ingresos.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, IngresoUnidad, IngresoUnidadF } from "@/lib/types";

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

  const unidadId   = Number(formData.get("unidad_id"));
  const concepto   = String(formData.get("concepto") ?? "").trim();
  const fecha      = String(formData.get("fecha") ?? "");
  const comprobante = String(formData.get("comprobante") ?? "").trim();

  // Formas de pago
  const pagoMovil = Number(formData.get("pago_movil"))  || 0;
  const movi      = Number(formData.get("movi"))        || 0;
  const dolares   = Number(formData.get("dolares"))     || 0;
  const montoBsDolar = Number(formData.get("monto_bs_dolar")) || 0;
  const totalConversion = Number(formData.get("total_conversion")) || (dolares * montoBsDolar);
  const efectivo  = Number(formData.get("efectivo"))    || 0;
  const otros     = Number(formData.get("otros"))       || 0;

  const nombreOperador = String(formData.get("nombre_operador") ?? "").trim();
  const nombreColector = String(formData.get("nombre_colector") ?? "").trim();
  const kilometrajeActual = Number(formData.get("kilometraje_actual")) || null;

  // El total es la suma de los pagos en Bs más la conversión de dólares a Bs
  const totalRecaudado = pagoMovil + movi + efectivo + otros + totalConversion;
  const esSinColector = nombreColector.trim().toLowerCase() === "sin colector";

  let ahorroUnidad = 0;
  let colector = 0;
  let operador = 0;
  let montoIngreso = 0;

  // Estructura de decisión: Sin colector vs Con colector
  if (esSinColector) {
    // Sin colector: Operador recibe 30%, Colector no se calcula (0%)
    ahorroUnidad = totalRecaudado * 0.25;
    colector = 0;
    operador = (totalRecaudado - ahorroUnidad) * 0.30;
    montoIngreso = totalRecaudado - colector - operador;
  } else {
    // Con colector (código actual): Colector 8%, Operador 25%
    ahorroUnidad = totalRecaudado * 0.25;
    colector = (totalRecaudado - ahorroUnidad) * 0.08;
    operador = (totalRecaudado - ahorroUnidad - colector) * 0.25;
    montoIngreso = totalRecaudado - colector - operador;
  }

  if (!concepto) {
    return { success: false, error: "El concepto (motivo del ingreso) es requerido." };
  }
  if (montoIngreso <= 0) {
    return { success: false, error: "El total debe ser mayor a cero. Ingresa al menos una forma de pago." };
  }
  if (!fecha) {
    return { success: false, error: "La fecha del ingreso es requerida." };
  }

  const { data: ingreso, error } = await supabase
    .from("ingresos_unidad")
    .insert({
      user_id:       user.id,
      unidad_id:     unidadId,
      concepto,
      monto_ingreso: montoIngreso,
      fecha,
      comprobante:   comprobante || null,
      pago_movil:    pagoMovil,
      movi,
      dolares,
      efectivo,
      otros,
      nombre_operador: nombreOperador || null,
      nombre_colector: nombreColector || null,
      kilometraje_actual: kilometrajeActual,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar el ingreso: ${error.message}` };
  }

  // Actualizar el kilometraje de la unidad si es mayor
  if (kilometrajeActual) {
    const { data: unidad } = await supabase
      .from("unidades")
      .select("kilometraje_actual")
      .eq("id", unidadId)
      .single();
      
    if (unidad && kilometrajeActual > (unidad.kilometraje_actual || 0)) {
      await supabase
        .from("unidades")
        .update({ kilometraje_actual: kilometrajeActual })
        .eq("id", unidadId);
    }
  }

  revalidatePath("/");
  return { success: true, data: ingreso as IngresoUnidad };
}

// -------------------------------------------------------
// Registrar un nuevo ingreso para Unidad Fraternidad
// -------------------------------------------------------
export async function registrarIngresoFraternidadAction(
  _prevState: ActionResult<IngresoUnidadF>,
  formData: FormData
): Promise<ActionResult<IngresoUnidadF>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const unidadId = Number(formData.get("unidad_id"));
  const concepto = String(formData.get("concepto") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "");
  const comprobante = String(formData.get("comprobante") ?? "").trim();

  // Formas de pago (sin movi)
  const pagoMovil = Number(formData.get("pago_movil")) || 0;
  const dolares = Number(formData.get("dolares")) || 0;
  const montoBsDolar = Number(formData.get("monto_bs_dolar")) || 0;
  const totalConversion = Number(formData.get("total_conversion")) || (dolares * montoBsDolar);
  const efectivo = Number(formData.get("efectivo")) || 0;
  const otros = Number(formData.get("otros")) || 0;

  // Campo gastos adicional para Fraternidad
  const gastos = Number(formData.get("gastos")) || 0;

  const nombreOperador = String(formData.get("nombre_operador") ?? "").trim();
  const kilometrajeActual = Number(formData.get("kilometraje_actual")) || null;

  // Total recaudado de las formas de pago
  const totalRecaudado = pagoMovil + efectivo + otros + totalConversion;
  
  // Regla Fraternidad: Ahorro de unidad 25%, Operador 30% (sin colector), Gastos se restan al ingreso
  const ahorroUnidad = totalRecaudado * 0.25;
  const operador = (totalRecaudado - ahorroUnidad) * 0.30;
  const montoIngreso = totalRecaudado - operador - gastos;

  if (!concepto) {
    return { success: false, error: "El concepto (motivo del ingreso) es requerido." };
  }
  if (totalRecaudado <= 0) {
    return { success: false, error: "El total debe ser mayor a cero. Ingresa al menos una forma de pago." };
  }
  if (!fecha) {
    return { success: false, error: "La fecha del ingreso es requerida." };
  }

  const { data: ingreso, error } = await supabase
    .from("ingresos_diarios_f")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      concepto,
      monto_ingreso: montoIngreso,
      fecha,
      comprobante: comprobante || null,
      pago_movil: pagoMovil,
      dolares,
      monto_bs_dolar: montoBsDolar,
      efectivo,
      otros,
      gastos,
      ahorro_unidad: ahorroUnidad,
      nombre_operador: nombreOperador || null,
      kilometraje_actual: kilometrajeActual,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al guardar el ingreso en Fraternidad: ${error.message}` };
  }

  // Actualizar el kilometraje de la unidad si es mayor
  if (kilometrajeActual) {
    const { data: unidad } = await supabase
      .from("unidades")
      .select("kilometraje_actual")
      .eq("id", unidadId)
      .single();
      
    if (unidad && kilometrajeActual > (unidad.kilometraje_actual || 0)) {
      await supabase
        .from("unidades")
        .update({ kilometraje_actual: kilometrajeActual })
        .eq("id", unidadId);
    }
  }

  revalidatePath("/");
  return { success: true, data: ingreso as IngresoUnidadF };
}

// -------------------------------------------------------
// Eliminar un ingreso
// -------------------------------------------------------
export async function eliminarIngresoAction(
  ingresoId: number,
  tabla: "ingresos_unidad" | "ingresos_diarios_f" = "ingresos_unidad"
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  // Intentamos eliminar de la tabla especificada
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("id", ingresoId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: `Error al eliminar: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}
