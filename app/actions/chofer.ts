"use server";

// ============================================================
// SERVER ACTIONS — Rendimiento de Operadores (Choferes)
// app/actions/chofer.ts
// ============================================================

import { createSupabaseServerClient } from "@/lib/supabase";
import type { ChoferPerformanceGroup, ChoferIngresoDetalle } from "@/lib/types";

export interface ChoferDateFilter {
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

function matchesDateFilter(
  dateStr?: string | null,
  filter?: ChoferDateFilter
): boolean {
  if (!filter) return true;
  const { fecha, fechaInicio, fechaFin } = filter;
  if (!fecha && !fechaInicio && !fechaFin) return true;

  if (!dateStr) return false;
  const cleanDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;

  if (fecha) {
    return cleanDate === fecha;
  }
  if (fechaInicio && cleanDate < fechaInicio) {
    return false;
  }
  if (fechaFin && cleanDate > fechaFin) {
    return false;
  }
  return true;
}

export async function getChoferPerformanceData(
  filter?: ChoferDateFilter
): Promise<ChoferPerformanceGroup[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  // Consultar unidades del usuario y los ingresos de ambas tablas en paralelo
  const [unidadesRes, ingresosComunRes, ingresosFRes] = await Promise.all([
    supabase
      .from("unidades")
      .select("id, numero_unidad, placa, marca, modelo, tipo_unidad")
      .eq("user_id", user.id),
    supabase
      .from("ingresos_unidad")
      .select("id, unidad_id, monto_ingreso, fecha, concepto, comprobante, nombre_operador")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
    supabase
      .from("ingresos_diarios_f")
      .select("id, unidad_id, monto_ingreso, fecha, concepto, comprobante, nombre_operador")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
  ]);

  const unidades = unidadesRes.data ?? [];
  const unidadMap = new Map(unidades.map((u) => [u.id, u]));

  // Combinar registros
  const rawComun = (ingresosComunRes.data ?? []).map((i) => ({
    id: i.id,
    unidad_id: i.unidad_id,
    nombre_operador: (i.nombre_operador ?? "").trim() || "Sin Asignar",
    monto_ingreso: Number(i.monto_ingreso) || 0,
    fecha: i.fecha,
    concepto: i.concepto || "Ingreso Diario",
    comprobante: i.comprobante || undefined,
  }));

  const rawF = (ingresosFRes.data ?? []).map((i) => ({
    id: i.id,
    unidad_id: i.unidad_id,
    nombre_operador: (i.nombre_operador ?? "").trim() || "Sin Asignar",
    monto_ingreso: Number(i.monto_ingreso) || 0,
    fecha: i.fecha,
    concepto: i.concepto || "Ingreso Fraternidad",
    comprobante: i.comprobante || undefined,
  }));

  const allRecords = [...rawComun, ...rawF].filter((r) =>
    matchesDateFilter(r.fecha, filter)
  );

  // Agrupar por operador y unidad_id
  const groupMap = new Map<string, ChoferPerformanceGroup>();

  for (const rec of allRecords) {
    const key = `${rec.nombre_operador}__${rec.unidad_id}`;
    const unidad = unidadMap.get(rec.unidad_id);
    const numeroUnidad = unidad?.numero_unidad || "S/N";
    const placa = unidad?.placa || "N/A";

    const detalleItem: ChoferIngresoDetalle = {
      id: rec.id,
      unidad_id: rec.unidad_id,
      numero_unidad: numeroUnidad,
      placa: placa,
      operador: rec.nombre_operador,
      ingreso: rec.monto_ingreso,
      fecha: rec.fecha,
      concepto: rec.concepto,
      comprobante: rec.comprobante,
    };

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        operador: rec.nombre_operador,
        unidad_id: rec.unidad_id,
        numero_unidad: numeroUnidad,
        placa: placa,
        ingreso_total: rec.monto_ingreso,
        total_viajes: 1,
        detalles: [detalleItem],
      });
    } else {
      const group = groupMap.get(key)!;
      group.ingreso_total += rec.monto_ingreso;
      group.total_viajes += 1;
      group.detalles.push(detalleItem);
    }
  }

  // Convertir a array y ordenar los detalles por fecha descendente
  const result = Array.from(groupMap.values()).map((g) => ({
    ...g,
    detalles: g.detalles.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
  }));

  // Ordenar grupos de mayor a menor ingreso total para evaluar rendimiento
  result.sort((a, b) => b.ingreso_total - a.ingreso_total);

  return result;
}
