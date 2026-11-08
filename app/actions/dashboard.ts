"use server";

// ============================================================
// SERVER ACTIONS — Dashboard Data
// app/actions/dashboard.ts
// ============================================================

import { createSupabaseServerClient } from "@/lib/supabase";
import type {
  DashboardData,
  FinancialSummary,
  MantenimientoAceite,
  OilChangeStatus,
  OilChangeStatusData,
  Unidad,
  GastoManoObra,
  RegistroMantenimiento,
  IngresoUnidad,
  ComprasDolares,
  OtroIngreso,
  OtroEgreso,
} from "@/lib/types";

// -------------------------------------------------------
// Lógica de Semáforo de Aceite (según reglas de negocio)
// -------------------------------------------------------
export async function getOilChangeStatus(
  kilometrajeActual: number,
  proximoKilometraje: number
): Promise<OilChangeStatus> {
  const kmRestantes = proximoKilometraje - kilometrajeActual;

  if (kmRestantes > 1000) return "green";
  if (kmRestantes >= 1) return "yellow";
  return "red"; // kmRestantes <= 0
}

// -------------------------------------------------------
// Cálculo de Rentabilidad Neta
// Fórmula: ingresos - (gastos_repuestos + mantenimientos_aceite + mano_obra)
// -------------------------------------------------------
export async function calcularRentabilidadNeta(
  totalIngresos: number,
  totalGastosRepuestos: number,
  totalMantenimientoAceite: number,
  totalManoObra: number
): Promise<number> {
  return totalIngresos - (totalGastosRepuestos + totalMantenimientoAceite + totalManoObra);
}

export interface DashboardDateFilter {
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

function matchesDateFilter(
  dateStr?: string | null,
  filter?: DashboardDateFilter
): boolean {
  if (!filter) return true;
  const { fecha, fechaInicio, fechaFin } = filter;
  if (!fecha && !fechaInicio && !fechaFin) return true;

  if (!dateStr) return false;
  // Normalizar dateStr a formato YYYY-MM-DD
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

// -------------------------------------------------------
// Obtiene todos los datos del Dashboard en paralelo
// Filtra por el usuario autenticado actualmente (via RLS + user_id)
// -------------------------------------------------------
export async function getDashboardData(
  unidadId: number,
  filter?: DashboardDateFilter
): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  // Consultas paralelas para máximo rendimiento
  // El RLS de Supabase garantiza que solo se retornan datos del usuario
  const [
    unidadRes,
    ingresosRes,
    ingresosFRes,
    mantenimientosRes,
    registrosMantenimientoRes,
    comprasDolaresRes,
    otrosIngresosRes,
    otrosEgresosRes,
  ] =
    await Promise.all([
      supabase
        .from("unidades")
        .select("*")
        .eq("id", unidadId)
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("ingresos_unidad")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),

      supabase
        .from("ingresos_diarios_f")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),

      supabase
        .from("mantenimientos_aceite")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha_servicio", { ascending: false })
        .order("kilometraje_servicio", { ascending: false }),

      supabase
        .from("registros_mantenimiento")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),

      supabase
        .from("compras_dolares")
        .select("cantidad_dolares, costo_bolivares, tasa_cambio, fecha")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id),

      supabase
        .from("otros_ingresos")
        .select("*")
        .eq("user_id", user.id),

      supabase
        .from("otros_egresos")
        .select("*")
        .eq("user_id", user.id),
    ]);

  // Manejar errores de unidad (crítico)
  if (unidadRes.error || !unidadRes.data) {
    throw new Error(
      `Error al cargar la unidad ${unidadId}: ${unidadRes.error?.message ?? "No encontrada o sin acceso"}`
    );
  }

  const unidad: Unidad = unidadRes.data;
  const rawIngresosComun = (ingresosRes.data ?? []).map((i) => ({ ...i, tipo_tabla: "comun" as const }));
  const rawIngresosF = (ingresosFRes.data ?? []).map((i) => ({ ...i, tipo_tabla: "fraternidad" as const }));
  const rawIngresos = [...rawIngresosComun, ...rawIngresosF].sort((a, b) => {
    // 1. Por fecha descendente
    const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;

    // 2. Si tienen la misma fecha, el último registrado (created_at) primero
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;

    // 3. Desempate por id descendente
    return (b.id ?? 0) - (a.id ?? 0);
  });
  const rawMantenimientos = (mantenimientosRes.data ?? []) as MantenimientoAceite[];
  const rawRegistrosMantenimiento = (registrosMantenimientoRes.data ?? []) as RegistroMantenimiento[];
  const rawComprasDolares = (comprasDolaresRes?.data ?? []) as ComprasDolares[];
  const rawOtrosIngresos = (otrosIngresosRes?.data ?? []) as OtroIngreso[];
  const rawOtrosEgresos = (otrosEgresosRes?.data ?? []) as OtroEgreso[];

  // Aplicar filtros de fecha si se especificaron
  const ingresos = rawIngresos.filter((i) => matchesDateFilter(i.fecha, filter));
  const mantenimientos = rawMantenimientos.filter((m) => matchesDateFilter(m.fecha_servicio, filter));
  const registrosMantenimiento = rawRegistrosMantenimiento.filter((r) => matchesDateFilter(r.fecha, filter));
  const comprasDolares = rawComprasDolares.filter((c) => matchesDateFilter(c.fecha, filter));
  const otrosIngresos = rawOtrosIngresos.filter((o) => matchesDateFilter(o.fecha, filter));
  const otrosEgresos = rawOtrosEgresos.filter((o) => matchesDateFilter(o.fecha, filter));

  // ---- Cálculos financieros ----
  // Las compras de dólares son operaciones globales de tesorería:
  // no restan bolívares ni agregan dólares comprados a nivel de unidad individual.
  const totalDolaresComprados = 0;
  const totalBsUsadosCompras = 0;

  // Gastos en Bs directos (NO convertidos a USD)
  const totalGastosBsDirecto = registrosMantenimiento.reduce((sum, r) =>
    sum + (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0), 0
  );

  // monto_ingreso ya tiene las deducciones de operador/colector aplicadas (factor 0.7675)
  // Ingresos en Bs recaudados por la unidad (sin restar compra global de divisas).
  const totalIngresosBolivaresBruto =
    ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0);

  // totalIngresosBolivares = ingreso disponible en Bs generado por la unidad
  const totalIngresosBolivares = totalIngresosBolivaresBruto;
  const totalIngresos = totalIngresosBolivares;

  const totalIngresosDolares =
    ingresos.reduce(
      (sum, i) => sum + (Number(i.dolares) || 0),
      0
    );

  // Los gastos de mantenimiento se separan en repuestos, mano de obra y mantenimiento de aceite
  const totalGastosRepuestos = registrosMantenimiento.reduce(
    (sum, r) => sum + ((r as any).rep_subtotal ?? 0),
    0
  );
  const totalManoObra = registrosMantenimiento.reduce(
    (sum, r) => sum + (Number(r.mo_costo) || 0),
    0
  );
  const totalGastosRepuestosBs = registrosMantenimiento.reduce((sum, r) => {
    const directBs = (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0);
    if (directBs > 0) return sum + directBs;
    if (r.costo_bolivares) return sum + Number(r.costo_bolivares);
    if (r.tasa_cambio && r.costo_total) return sum + (Number(r.costo_total) * Number(r.tasa_cambio));
    return sum;
  }, 0);
  const totalMantenimientoAceite = mantenimientos.reduce(
    (sum, m) => sum + (m.costo_servicio ?? 0),
    0
  );
  const totalGastosMantenimiento = totalGastosRepuestos + totalManoObra + totalMantenimientoAceite;

  // Otros Ingresos (globales del usuario, no por unidad)
  const totalOtrosIngresosDolares = otrosIngresos
    .filter((o) => o.tipo_moneda === "USD")
    .reduce((s, o) => s + (Number(o.monto_usd) || 0), 0);
  const totalOtrosIngresosBolivares = otrosIngresos
    .filter((o) => o.tipo_moneda === "BS")
    .reduce((s, o) => s + (Number(o.monto_bs) || 0), 0);

  // Otros Egresos (globales del usuario, se descuentan del Resumen de Unidad y General)
  const totalOtrosEgresosDolares = otrosEgresos
    .filter((o) => o.tipo_moneda === "USD")
    .reduce((s, o) => s + (Number(o.monto_usd) || 0), 0);
  const totalOtrosEgresosBolivares = otrosEgresos
    .filter((o) => o.tipo_moneda === "BS")
    .reduce((s, o) => s + (Number(o.monto_bs) || 0), 0);

  const rentabilidadDolares = (totalIngresosDolares + totalOtrosIngresosDolares) - totalGastosMantenimiento - totalOtrosEgresosDolares;
  const rentabilidadBolivares = (totalIngresosBolivares + totalOtrosIngresosBolivares) - totalGastosRepuestosBs - totalOtrosEgresosBolivares;
  const rentabilidadNeta = rentabilidadDolares;
  // Rentabilidad en Bs: Ingresos Bs − Gastos directos en Bs − Otros Egresos en Bs
  const rentabilidadBsDirecta = (totalIngresosBolivares + totalOtrosIngresosBolivares) - totalGastosBsDirecto - totalOtrosEgresosBolivares;

  // Saldo pendiente por pagar: SOLO de registros donde se ingresó un abono (abono > 0) y costo_total > abono
  const totalSaldoPendiente = registrosMantenimiento.reduce((sum, r) => {
    const abono = Number(r.abono) || 0;
    if (abono <= 0) return sum;
    const costo = Number(r.costo_total) || 0;
    const pendiente = costo - abono;
    return sum + (pendiente > 0 ? pendiente : 0);
  }, 0);

  const financialSummary: FinancialSummary = {
    totalIngresos,
    totalIngresosDolares,
    totalIngresosBolivares,
    totalIngresosBolivaresBruto,
    totalGastosRepuestos,
    totalGastosRepuestosBs,
    totalMantenimientoAceite,
    totalManoObra,
    rentabilidadDolares,
    rentabilidadBolivares,
    rentabilidadNeta,
    totalDolaresComprados,
    totalBsUsadosCompras,
    totalGastosBsDirecto,
    rentabilidadBsDirecta,
    totalSaldoPendiente,
    totalOtrosIngresosDolares,
    totalOtrosIngresosBolivares,
    totalOtrosEgresosDolares,
    totalOtrosEgresosBolivares,
  };

  // ---- Estado del semáforo de aceite ----
  // El semáforo debe reflejar el estado mecánico real de la unidad (último servicio histórico),
  // independientemente de si hay un filtro de fecha activo para los ingresos/gastos.
  const ultimoMantenimiento = rawMantenimientos[0] ?? null;
  const proximoKilometraje = ultimoMantenimiento?.proximo_kilometraje ?? 0;
  const kmRestantes = ultimoMantenimiento
    ? proximoKilometraje - unidad.kilometraje_actual
    : 0;

  const oilStatus = await getOilChangeStatus(
    unidad.kilometraje_actual,
    proximoKilometraje
  );

  const oilChangeStatusData: OilChangeStatusData = {
    status: ultimoMantenimiento ? oilStatus : "green",
    kmRestantes,
    proximoKilometraje,
    ultimoServicio: ultimoMantenimiento,
  };

  return {
    unidad,
    financialSummary,
    oilChangeStatus: oilChangeStatusData,
    ultimosMantenimientos: mantenimientos,
    ultimosGastos: [],
    ultimosGastosManoObra: [],
    ultimosIngresos: ingresos,
    ultimosRegistrosMantenimiento: registrosMantenimiento,
    otrosIngresos,
    otrosEgresos,
  };
}

// -------------------------------------------------------
// Obtiene todas las unidades del usuario autenticado
// -------------------------------------------------------
export async function getUnidadesUsuario() {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return [];

  const { data } = await supabase
    .from("unidades")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return data ?? [];
}

// -------------------------------------------------------
// Obtiene el historial de ingresos de una unidad
// -------------------------------------------------------
export async function getIngresosByUnidad(
  unidadId: number
): Promise<IngresoUnidad[]> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ingresos_unidad")
    .select("*")
    .eq("unidad_id", unidadId)
    .eq("user_id", user.id)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  return data ?? [];
}

// -------------------------------------------------------
// Obtiene un resumen global de TODAS las unidades del usuario
// -------------------------------------------------------

export interface ResumenPorUnidad {
  unidad_id: number;
  placa: string;
  numero_unidad?: string | null;
  marca: string;
  modelo: string;
  /** Tipo de unidad; las de tipo "Otra" no se suman al Resumen General */
  tipo_unidad?: string | null;
  totalIngresos: number;
  totalIngresosDolares: number;
  totalIngresosBolivares: number;
  totalIngresosBolivaresBruto?: number;
  totalGastosRepuestos: number;
  totalGastosRepuestosBs: number;
  totalMantenimientoAceite: number;
  totalManoObra: number;
  rentabilidadDolares: number;
  rentabilidadBolivares: number;
  rentabilidadNeta: number;
  totalDolaresComprados?: number;
  totalBsUsadosCompras?: number;
  /** Total de gastos en Bs directos (precio_bs_repuestos + precio_bs_mano_obra) */
  totalGastosBsDirecto?: number;
  /** Rentabilidad Bs directa = Ingresos Bs - Gastos Bs directos */
  rentabilidadBsDirecta?: number;
  /** Saldo pendiente por pagar ($) */
  totalSaldoPendiente?: number;
}

export interface GlobalMovimientos {
  ingresos: any[];
  mantenimientos: any[];
  registrosMantenimiento: any[];
  otrosIngresos: any[];
  otrosEgresos: any[];
  comprasDolares: any[];
}

export async function getGlobalDashboardData(filter?: DashboardDateFilter): Promise<{
  financialSummary: FinancialSummary;
  unidadesCount: number;
  resumenPorUnidad: ResumenPorUnidad[];
  movimientos?: GlobalMovimientos;
  unidades?: Unidad[];
}> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  const [
    unidadesRes,
    ingresosRes,
    ingresosFRes,
    mantenimientosRes,
    registrosMantenimientoRes,
    comprasDolaresRes,
    otrosIngresosGlobalRes,
    otrosEgresosGlobalRes,
  ] = await Promise.all([
    supabase.from("unidades").select("*").eq("user_id", user.id),
    supabase.from("ingresos_unidad").select("*").eq("user_id", user.id),
    supabase.from("ingresos_diarios_f").select("*").eq("user_id", user.id),
    supabase.from("mantenimientos_aceite").select("*").eq("user_id", user.id),
    supabase.from("registros_mantenimiento").select("*").eq("user_id", user.id),
    supabase.from("compras_dolares").select("*").eq("user_id", user.id),
    supabase.from("otros_ingresos").select("*").eq("user_id", user.id),
    supabase.from("otros_egresos").select("*").eq("user_id", user.id),
  ]);

  const unidades = unidadesRes.data ?? [];

  // IDs de unidades tipo "Otra": sus ingresos/egresos NO se suman al Resumen General
  const idsOtra = new Set(
    unidades.filter((u) => (u as any).tipo_unidad === "Otra").map((u) => u.id)
  );

  const rawIngresos = [
    ...(ingresosRes.data ?? []).map((i) => ({ ...i, tipo_tabla: "comun" as const })),
    ...(ingresosFRes.data ?? []).map((i) => ({ ...i, movi: 0, tipo_tabla: "fraternidad" as const })),
  ];
  const rawMantenimientos = mantenimientosRes.data ?? [];
  const rawRegistrosMantenimiento = registrosMantenimientoRes.data ?? [];
  const rawComprasDolares = (comprasDolaresRes?.data ?? []) as ComprasDolares[];
  const rawOtrosIngresosGlobal = (otrosIngresosGlobalRes?.data ?? []) as { tipo_moneda: string; monto_usd: number; monto_bs: number; fecha: string }[];
  const rawOtrosEgresosGlobal = (otrosEgresosGlobalRes?.data ?? []) as { tipo_moneda: string; monto_usd: number; monto_bs: number; fecha: string }[];

  // Aplicar filtros de fecha si se especificaron
  const ingresos = rawIngresos.filter((i) => matchesDateFilter(i.fecha, filter));
  const mantenimientos = rawMantenimientos.filter((m) => matchesDateFilter(m.fecha_servicio, filter));
  const registrosMantenimiento = rawRegistrosMantenimiento.filter((r) => matchesDateFilter(r.fecha, filter));
  const comprasDolares = rawComprasDolares.filter((c) => matchesDateFilter(c.fecha, filter));
  const otrosIngresosGlobal = rawOtrosIngresosGlobal.filter((o) => matchesDateFilter(o.fecha, filter));
  const otrosEgresosGlobal = rawOtrosEgresosGlobal.filter((o) => matchesDateFilter(o.fecha, filter));

  // Para el Resumen General (financialSummary) se excluyen las unidades tipo "Otra"
  const ingresosGlobal = ingresos.filter((i) => !idsOtra.has(i.unidad_id));
  const mantenimientosGlobal = mantenimientos.filter((m) => !idsOtra.has(m.unidad_id));
  const registrosMantenimientoGlobal = registrosMantenimiento.filter((r) => !idsOtra.has(r.unidad_id));

  // Totales globales
  const totalDolaresComprados = comprasDolares.reduce(
    (sum, c) => sum + (Number(c.cantidad_dolares) || 0),
    0
  );
  const totalBsUsadosCompras = comprasDolares.reduce(
    (sum, c) =>
      sum +
      (Number(c.costo_bolivares) ||
        (Number(c.cantidad_dolares) * Number(c.tasa_cambio)) ||
        0),
    0
  );

  // Gastos en Bs directos (NO convertidos a USD) — solo unidades no-Otra
  const totalGastosBsDirecto = registrosMantenimientoGlobal.reduce((sum, r) =>
    sum + (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0), 0
  );

  // Total de todos los bolívares acumulados / recaudados (excluyendo unidades "Otra")
  const totalBolivaresAcumulados = ingresosGlobal.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0);

  // monto_ingreso ya tiene las deducciones de operador/colector (factor 0.7675)
  // Ingresos en Bs: neto tras compra de divisas. NO se restan gastos directos en Bs.
  const totalIngresosBolivaresBruto =
    totalBolivaresAcumulados - totalBsUsadosCompras;

  // totalIngresosBolivares = ingreso disponible en Bs (sin restar gastos directos en Bs)
  const totalIngresosBolivares = totalIngresosBolivaresBruto;
  const totalIngresos = totalIngresosBolivares;

  const totalIngresosDolares =
    ingresosGlobal.reduce((sum, i) => sum + (Number(i.dolares) || 0), 0) +
    totalDolaresComprados;

  const totalGastosRepuestos = registrosMantenimientoGlobal.reduce((sum, r) => sum + ((r as any).rep_subtotal ?? 0), 0);
  const totalManoObra = registrosMantenimientoGlobal.reduce((sum, r) => sum + ((r as any).mo_costo ?? 0), 0);
  const totalMantenimientoAceite = mantenimientosGlobal.reduce((sum, m) => sum + (m.costo_servicio ?? 0), 0);
  const totalGastosMantenimiento = totalGastosRepuestos + totalManoObra + totalMantenimientoAceite;
  const totalGastosRepuestosBs = registrosMantenimientoGlobal.reduce((sum, r) => {
    const directBs = (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0);
    if (directBs > 0) return sum + directBs;
    if (r.costo_bolivares) return sum + Number(r.costo_bolivares);
    if (r.tasa_cambio && r.costo_total) return sum + (Number(r.costo_total) * Number(r.tasa_cambio));
    return sum;
  }, 0);

  // Rentabilidad global en USD = Ingresos$ − (Repuestos$ + Mano de Obra$ + Aceite$) + Otros Ingresos$ − Otros Egresos$
  const totalOtrosIngresosDolares = otrosIngresosGlobal
    .filter((o) => o.tipo_moneda === "USD")
    .reduce((s, o) => s + (Number(o.monto_usd) || 0), 0);
  const totalOtrosIngresosBolivares = otrosIngresosGlobal
    .filter((o) => o.tipo_moneda === "BS")
    .reduce((s, o) => s + (Number(o.monto_bs) || 0), 0);

  // Otros Egresos Globales
  const totalOtrosEgresosDolares = otrosEgresosGlobal
    .filter((o) => o.tipo_moneda === "USD")
    .reduce((s, o) => s + (Number(o.monto_usd) || 0), 0);
  const totalOtrosEgresosBolivares = otrosEgresosGlobal
    .filter((o) => o.tipo_moneda === "BS")
    .reduce((s, o) => s + (Number(o.monto_bs) || 0), 0);

  const rentabilidadDolares = (totalIngresosDolares + totalOtrosIngresosDolares) - totalGastosMantenimiento - totalOtrosEgresosDolares;
  const rentabilidadBolivares = (totalIngresosBolivares + totalOtrosIngresosBolivares) - totalGastosRepuestosBs - totalOtrosEgresosBolivares;
  const rentabilidadNeta = rentabilidadDolares;
  // Rentabilidad en Bs: Ingresos Bs − Gastos directos en Bs − Otros Egresos en Bs
  const rentabilidadBsDirecta = (totalIngresosBolivares + totalOtrosIngresosBolivares) - totalGastosBsDirecto - totalOtrosEgresosBolivares;

  // Total saldo pendiente por pagar global: SOLO de registros con abono > 0 y costo_total > abono
  // Excluye unidades tipo "Otra"
  const totalSaldoPendiente = registrosMantenimientoGlobal.reduce((sum, r) => {
    const abono = Number(r.abono) || 0;
    if (abono <= 0) return sum;
    const costo = Number(r.costo_total) || 0;
    const pendiente = costo - abono;
    return sum + (pendiente > 0 ? pendiente : 0);
  }, 0);

  // Desglose por unidad
  const resumenPorUnidad: ResumenPorUnidad[] = unidades.map((u) => {
    const uid = u.id;
    const uIngresosList = ingresos.filter((i) => i.unidad_id === uid);
    // Las compras de dólares son globales: solo restan bolívares en el Resumen Global, NO del resumen por unidad
    const uDolaresComprados = 0;
    const uBsUsadosCompras = 0;

    // Gastos en Bs directos por unidad (NO convertidos)
    const uGastosBsDirecto = registrosMantenimiento
      .filter((r) => r.unidad_id === uid)
      .reduce((s, r) => s + (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0), 0);

    // Ingresos en Bs propios recaudados por la unidad (sin restar compra de divisas global)
    const uIngresosBolivaresBruto =
      uIngresosList.reduce((s, i) => s + (i.monto_ingreso ?? 0), 0);

    // Ingresos Bs por unidad: recaudación real de la unidad. NO se restan compras de dólares globales ni gastos directos.
    const uIngresosBolivares = uIngresosBolivaresBruto;
    const uIngresos = uIngresosBolivares;

    // Ingresos en $ propios recaudados por la unidad
    const uIngresosDolares =
      uIngresosList.reduce((s, i) => s + (Number(i.dolares) || 0), 0);

    const uGastos = registrosMantenimiento.filter((r) => r.unidad_id === uid).reduce((s, r) => s + ((r as any).rep_subtotal ?? 0), 0);
    const uManoObra = registrosMantenimiento.filter((r) => r.unidad_id === uid).reduce((s, r) => s + ((r as any).mo_costo ?? 0), 0);
    const uGastosBs = registrosMantenimiento.filter((r) => r.unidad_id === uid).reduce((s, r) => {
      const directBs = (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0);
      if (directBs > 0) return s + directBs;
      if (r.costo_bolivares) return s + Number(r.costo_bolivares);
      if (r.tasa_cambio && r.costo_total) return s + (Number(r.costo_total) * Number(r.tasa_cambio));
      return s;
    }, 0);
    const uAceite = mantenimientos.filter((m) => m.unidad_id === uid).reduce((s, m) => s + (m.costo_servicio ?? 0), 0);
    // Rentabilidad $ por unidad = Ingresos$ − (Repuestos$ + Mano de Obra$ + Aceite$)
    const uRentabilidadDolares = uIngresosDolares - (uGastos + uManoObra + uAceite);
    const uRentabilidadBolivares = uIngresosBolivares - uGastosBs;
    // Rentabilidad en Bs por unidad: Ingresos Bs − Gastos directos en Bs
    const uRentabilidadBsDirecta = uIngresosBolivares - uGastosBsDirecto;

    // Saldo pendiente por pagar por unidad: SOLO de registros con abono > 0 y costo_total > abono
    const uSaldoPendiente = registrosMantenimiento
      .filter((r) => r.unidad_id === uid)
      .reduce((s, r) => {
        const abono = Number(r.abono) || 0;
        if (abono <= 0) return s;
        const costo = Number(r.costo_total) || 0;
        const pendiente = costo - abono;
        return s + (pendiente > 0 ? pendiente : 0);
      }, 0);

    return {
      unidad_id: uid,
      placa: u.placa,
      numero_unidad: u.numero_unidad,
      marca: u.marca,
      modelo: u.modelo,
      tipo_unidad: (u as any).tipo_unidad ?? null,
      totalIngresos: uIngresos,
      totalIngresosDolares: uIngresosDolares,
      totalIngresosBolivares: uIngresosBolivares,
      totalIngresosBolivaresBruto: uIngresosBolivaresBruto,
      totalGastosRepuestos: uGastos,
      totalGastosRepuestosBs: uGastosBs,
      totalMantenimientoAceite: uAceite,
      totalManoObra: uManoObra,
      rentabilidadDolares: uRentabilidadDolares,
      rentabilidadBolivares: uRentabilidadBolivares,
      rentabilidadNeta: uRentabilidadDolares,
      totalDolaresComprados: uDolaresComprados,
      totalBsUsadosCompras: uBsUsadosCompras,
      totalGastosBsDirecto: uGastosBsDirecto,
      rentabilidadBsDirecta: uRentabilidadBsDirecta,
      totalSaldoPendiente: uSaldoPendiente,
    };
  });

  return {
    unidadesCount: unidades.length,
    financialSummary: {
      totalIngresos,
      totalIngresosDolares,
      totalIngresosBolivares,
      totalIngresosBolivaresBruto,
      totalBolivaresAcumulados,
      totalGastosRepuestos,
      totalGastosRepuestosBs,
      totalMantenimientoAceite,
      totalManoObra,
      rentabilidadDolares,
      rentabilidadBolivares,
      rentabilidadNeta,
      totalDolaresComprados,
      totalBsUsadosCompras,
      totalGastosBsDirecto,
      rentabilidadBsDirecta,
      totalSaldoPendiente,
      totalOtrosIngresosDolares,
      totalOtrosIngresosBolivares,
      totalOtrosEgresosDolares,
      totalOtrosEgresosBolivares,
    },
    resumenPorUnidad,
    movimientos: {
      ingresos: ingresosGlobal,
      mantenimientos: mantenimientosGlobal,
      registrosMantenimiento: registrosMantenimientoGlobal,
      otrosIngresos: otrosIngresosGlobal,
      otrosEgresos: otrosEgresosGlobal,
      comprasDolares,
    },
    unidades: unidades as Unidad[],
  };
}
