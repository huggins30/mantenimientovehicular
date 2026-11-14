"use server";

// ============================================================
// SERVER ACTIONS — Financiamiento
// app/actions/financiamiento.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import type { ActionResult, OtroEgreso, RegistroMantenimiento, PagoFinanciamiento } from "@/lib/types";

// -------------------------------------------------------
// Sincronizar montos de pagos con registros de mantenimiento y otros egresos
// -------------------------------------------------------
export async function sincronizarPagosConRegistros(userId: string) {
  const { data: pagos } = await supabaseAdmin
    .from("pagos_financiamiento")
    .select("*")
    .eq("user_id", userId);

  if (!pagos || pagos.length === 0) return;

  const manMap = new Map<number, { usd: number; bs: number }>();
  const oeMap = new Map<number, { usd: number; bs: number }>();

  for (const p of pagos) {
    if (p.registro_mantenimiento_id) {
      const cur = manMap.get(p.registro_mantenimiento_id) || { usd: 0, bs: 0 };
      if (p.tipo_moneda === "USD") cur.usd += Number(p.monto_usd) || 0;
      if (p.tipo_moneda === "BS") cur.bs += Number(p.monto_bs) || 0;
      manMap.set(p.registro_mantenimiento_id, cur);
    }
    if (p.otro_egreso_id) {
      const cur = oeMap.get(p.otro_egreso_id) || { usd: 0, bs: 0 };
      if (p.tipo_moneda === "USD") cur.usd += Number(p.monto_usd) || 0;
      if (p.tipo_moneda === "BS") cur.bs += Number(p.monto_bs) || 0;
      oeMap.set(p.otro_egreso_id, cur);
    }
  }

  // Actualizar registros_mantenimiento que tengan pagos registrados
  // NOTA: costo_total y rep_subtotal son columnas generadas (GENERATED ALWAYS AS).
  // Se actualiza mo_costo con el total USD para que Postgres calcule costo_total automáticamente.
  for (const [manId, totals] of manMap.entries()) {
    await supabaseAdmin
      .from("registros_mantenimiento")
      .update({
        mo_costo: totals.usd,
        rep_costo_unitario: 0,
        precio_bs_repuestos: totals.bs,
      })
      .eq("id", manId)
      .eq("user_id", userId);
  }

  // Actualizar otros_egresos que tengan pagos registrados
  for (const [oeId, totals] of oeMap.entries()) {
    await supabaseAdmin
      .from("otros_egresos")
      .update({
        monto_usd: totals.usd,
        monto_bs: totals.bs,
      })
      .eq("id", oeId)
      .eq("user_id", userId);
  }
}

// -------------------------------------------------------
// Obtener todos los egresos financiados del usuario
// -------------------------------------------------------
export async function getEgresosFinanciados(): Promise<{
  otrosEgresos: OtroEgreso[];
  mantenimientos: RegistroMantenimiento[];
}> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { otrosEgresos: [], mantenimientos: [] };

  // Sincronizar montos de pagos con registros existentes
  await sincronizarPagosConRegistros(user.id);

  const [oeRes, manRes] = await Promise.all([
    supabase
      .from("otros_egresos")
      .select("*")
      .eq("user_id", user.id)
      .eq("financiado", true)
      .order("fecha", { ascending: false }),
    supabase
      .from("registros_mantenimiento")
      .select("*")
      .eq("user_id", user.id)
      .eq("financiado", true)
      .order("fecha", { ascending: false }),
  ]);

  return {
    otrosEgresos: (oeRes.data ?? []) as OtroEgreso[],
    mantenimientos: (manRes.data ?? []) as RegistroMantenimiento[],
  };
}

// -------------------------------------------------------
// Obtener pagos de un egreso financiado
// -------------------------------------------------------
export async function getPagosFinanciamiento(filter?: {
  otroEgresoId?: number;
  registroMantenimientoId?: number;
}): Promise<PagoFinanciamiento[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("pagos_financiamiento")
    .select("*")
    .eq("user_id", user.id)
    .order("fecha", { ascending: false });

  if (filter?.otroEgresoId) {
    query = query.eq("otro_egreso_id", filter.otroEgresoId);
  }
  if (filter?.registroMantenimientoId) {
    query = query.eq("registro_mantenimiento_id", filter.registroMantenimientoId);
  }

  const { data } = await query;
  return (data ?? []) as PagoFinanciamiento[];
}

// -------------------------------------------------------
// Registrar un pago de financiamiento
// -------------------------------------------------------
export async function registrarPagoFinanciamientoAction(
  _prevState: ActionResult<PagoFinanciamiento>,
  formData: FormData
): Promise<ActionResult<PagoFinanciamiento>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const otroEgresoId = formData.get("otro_egreso_id") ? Number(formData.get("otro_egreso_id")) : null;
  const registroMantenimientoId = formData.get("registro_mantenimiento_id") ? Number(formData.get("registro_mantenimiento_id")) : null;
  const tipoMoneda = String(formData.get("tipo_moneda") ?? "USD").trim() as "USD" | "BS";
  const montoUsd = Number(formData.get("monto_usd")) || 0;
  const montoBs = Number(formData.get("monto_bs")) || 0;
  const fecha = String(formData.get("fecha") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;
  const pagoCompleto = formData.get("pago_completo") === "true";

  if (!otroEgresoId && !registroMantenimientoId) {
    return { success: false, error: "Referencia de financiamiento inválida." };
  }
  if (!fecha) {
    return { success: false, error: "La fecha es requerida." };
  }
  if (tipoMoneda === "USD" && montoUsd <= 0) {
    return { success: false, error: "El monto en dólares debe ser mayor a cero." };
  }
  if (tipoMoneda === "BS" && montoBs <= 0) {
    return { success: false, error: "El monto en bolívares debe ser mayor a cero." };
  }

  // 1. Insertar el nuevo pago
  const { data, error } = await supabase
    .from("pagos_financiamiento")
    .insert({
      user_id: user.id,
      otro_egreso_id: otroEgresoId,
      registro_mantenimiento_id: registroMantenimientoId,
      tipo_moneda: tipoMoneda,
      monto_usd: tipoMoneda === "USD" ? montoUsd : 0,
      monto_bs: tipoMoneda === "BS" ? montoBs : 0,
      fecha,
      notas,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al registrar pago: ${error.message}` };
  }

  // 2. Sumar todos los pagos del ítem (incluyendo el recién insertado)
  if (registroMantenimientoId) {
    const { data: allPagos } = await supabaseAdmin
      .from("pagos_financiamiento")
      .select("monto_usd, monto_bs")
      .eq("registro_mantenimiento_id", registroMantenimientoId)
      .eq("user_id", user.id);

    const totalUSD = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_usd) || 0), 0);
    const totalBs = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_bs) || 0), 0);

    // Actualizar registro_mantenimiento: refleja los montos pagados y si pago_completo es true, cancela el financiamiento
    await supabaseAdmin
      .from("registros_mantenimiento")
      .update({
        mo_costo: totalUSD,
        rep_costo_unitario: 0,
        precio_bs_repuestos: totalBs,
        financiado: pagoCompleto ? false : true,
      })
      .eq("id", registroMantenimientoId)
      .eq("user_id", user.id);
  } else if (otroEgresoId) {
    const { data: allPagos } = await supabaseAdmin
      .from("pagos_financiamiento")
      .select("monto_usd, monto_bs")
      .eq("otro_egreso_id", otroEgresoId)
      .eq("user_id", user.id);

    const totalUSD = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_usd) || 0), 0);
    const totalBs = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_bs) || 0), 0);

    // Actualizar otros_egresos
    await supabaseAdmin
      .from("otros_egresos")
      .update({
        monto_usd: totalUSD,
        monto_bs: totalBs,
        financiado: pagoCompleto ? false : true,
      })
      .eq("id", otroEgresoId)
      .eq("user_id", user.id);
  }

  revalidatePath("/", "layout");
  return { success: true, data: data as PagoFinanciamiento };
}

// -------------------------------------------------------
// Eliminar un pago de financiamiento
// -------------------------------------------------------
export async function eliminarPagoFinanciamientoAction(id: number): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado." };

  // 1. Obtener la referencia antes de borrar
  const { data: pagoExistente } = await supabaseAdmin
    .from("pagos_financiamiento")
    .select("registro_mantenimiento_id, otro_egreso_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabaseAdmin
    .from("pagos_financiamiento")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  // 2. Recalcular y actualizar totales en el registro padre
  if (pagoExistente?.registro_mantenimiento_id) {
    const { data: allPagos } = await supabaseAdmin
      .from("pagos_financiamiento")
      .select("monto_usd, monto_bs")
      .eq("registro_mantenimiento_id", pagoExistente.registro_mantenimiento_id)
      .eq("user_id", user.id);

    const totalUSD = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_usd) || 0), 0);
    const totalBs = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_bs) || 0), 0);

    await supabaseAdmin
      .from("registros_mantenimiento")
      .update({
        mo_costo: totalUSD,
        rep_costo_unitario: 0,
        precio_bs_repuestos: totalBs,
      })
      .eq("id", pagoExistente.registro_mantenimiento_id)
      .eq("user_id", user.id);
  } else if (pagoExistente?.otro_egreso_id) {
    const { data: allPagos } = await supabaseAdmin
      .from("pagos_financiamiento")
      .select("monto_usd, monto_bs")
      .eq("otro_egreso_id", pagoExistente.otro_egreso_id)
      .eq("user_id", user.id);

    const totalUSD = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_usd) || 0), 0);
    const totalBs = (allPagos ?? []).reduce((s, p) => s + (Number(p.monto_bs) || 0), 0);

    await supabaseAdmin
      .from("otros_egresos")
      .update({
        monto_usd: totalUSD,
        monto_bs: totalBs,
      })
      .eq("id", pagoExistente.otro_egreso_id)
      .eq("user_id", user.id);
  }

  revalidatePath("/", "layout");
  return { success: true };
}
