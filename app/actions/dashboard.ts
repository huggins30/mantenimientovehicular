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
    mantenimientosRes,
    registrosMantenimientoRes,
    comprasDolaresRes,
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
        .order("fecha", { ascending: false }),

      supabase
        .from("mantenimientos_aceite")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha_servicio", { ascending: false }),

      supabase
        .from("registros_mantenimiento")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha", { ascending: false }),

      supabase
        .from("compras_dolares")
        .select("cantidad_dolares, costo_bolivares, tasa_cambio, fecha")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id),
    ]);

  // Manejar errores de unidad (crítico)
  if (unidadRes.error || !unidadRes.data) {
    throw new Error(
      `Error al cargar la unidad ${unidadId}: ${unidadRes.error?.message ?? "No encontrada o sin acceso"}`
    );
  }

  const unidad: Unidad = unidadRes.data;
  const rawIngresos = ingresosRes.data ?? [];
  const rawMantenimientos = (mantenimientosRes.data ?? []) as MantenimientoAceite[];
  const rawRegistrosMantenimiento = (registrosMantenimientoRes.data ?? []) as RegistroMantenimiento[];
  const rawComprasDolares = (comprasDolaresRes?.data ?? []) as ComprasDolares[];

  // Aplicar filtros de fecha si se especificaron
  const ingresos = rawIngresos.filter((i) => matchesDateFilter(i.fecha, filter));
  const mantenimientos = rawMantenimientos.filter((m) => matchesDateFilter(m.fecha_servicio, filter));
  const registrosMantenimiento = rawRegistrosMantenimiento.filter((r) => matchesDateFilter(r.fecha, filter));
  const comprasDolares = rawComprasDolares.filter((c) => matchesDateFilter(c.fecha, filter));

  // ---- Cálculos financieros ----
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
  const totalIngresos =
    ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0) -
    totalBsUsadosCompras;
  const totalIngresosDolares =
    ingresos.reduce(
      (sum, i) => sum + (Number(i.dolares) || 0),
      0
    ) + totalDolaresComprados;
  // monto_ingreso ya tiene las deducciones de operador/colector aplicadas (factor 0.7675)
  // Es el "Ingreso Registrado" neto que el usuario ve en cada registro
  const totalIngresosBolivares =
    ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0) -
    totalBsUsadosCompras;
  // Los gastos de mantenimiento (repuesto + mano de obra) ya vienen unidos en costo_total
  const totalGastosMantenimiento = registrosMantenimiento.reduce(
    (sum, r) => sum + (r.costo_total ?? 0),
    0
  );
  const totalGastosRepuestosBs = registrosMantenimiento.reduce((sum, r) => {
    if (r.costo_bolivares) return sum + Number(r.costo_bolivares);
    if (r.tasa_cambio && r.costo_total) return sum + (Number(r.costo_total) * Number(r.tasa_cambio));
    return sum;
  }, 0);
  const totalMantenimientoAceite = mantenimientos.reduce(
    (sum, m) => sum + (m.costo_servicio ?? 0),
    0
  );

  const rentabilidadDolares = totalIngresosDolares - totalGastosMantenimiento;
  const rentabilidadBolivares = totalIngresosBolivares - totalGastosRepuestosBs;
  const rentabilidadNeta = rentabilidadDolares;

  const financialSummary: FinancialSummary = {
    totalIngresos,
    totalIngresosDolares,
    totalIngresosBolivares,
    totalGastosRepuestos: totalGastosMantenimiento,
    totalGastosRepuestosBs,
    totalMantenimientoAceite,
    totalManoObra: 0,
    rentabilidadDolares,
    rentabilidadBolivares,
    rentabilidadNeta,
    totalDolaresComprados,
    totalBsUsadosCompras,
  };

  // ---- Estado del semáforo de aceite ----
  const ultimoMantenimiento = mantenimientos[0] ?? null;
  const proximoKilometraje = ultimoMantenimiento?.proximo_kilometraje ?? 0;
  const kmRestantes = proximoKilometraje - unidad.kilometraje_actual;

  const oilStatus = await getOilChangeStatus(
    unidad.kilometraje_actual,
    proximoKilometraje
  );

  const oilChangeStatusData: OilChangeStatusData = {
    status: ultimoMantenimiento ? oilStatus : "green",
    kmRestantes: Math.max(kmRestantes, 0),
    proximoKilometraje,
    ultimoServicio: ultimoMantenimiento,
  };

  return {
    unidad,
    financialSummary,
    oilChangeStatus: oilChangeStatusData,
    ultimosMantenimientos: mantenimientos.slice(0, 5),
    ultimosGastos: [],
    ultimosGastosManoObra: [],
    ultimosIngresos: ingresos,
    ultimosRegistrosMantenimiento: registrosMantenimiento,
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
    .order("fecha", { ascending: false });

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
  totalIngresos: number;
  totalIngresosDolares: number;
  totalIngresosBolivares: number;
  totalGastosRepuestos: number;
  totalGastosRepuestosBs: number;
  totalMantenimientoAceite: number;
  totalManoObra: number;
  rentabilidadDolares: number;
  rentabilidadBolivares: number;
  rentabilidadNeta: number;
  totalDolaresComprados?: number;
  totalBsUsadosCompras?: number;
}

export async function getGlobalDashboardData(filter?: DashboardDateFilter): Promise<{
  financialSummary: FinancialSummary;
  unidadesCount: number;
  resumenPorUnidad: ResumenPorUnidad[];
}> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  const [
    unidadesRes,
    ingresosRes,
    mantenimientosRes,
    registrosMantenimientoRes,
    comprasDolaresRes,
  ] = await Promise.all([
    supabase.from("unidades").select("id, placa, marca, modelo, numero_unidad").eq("user_id", user.id),
    supabase.from("ingresos_unidad").select("unidad_id, monto_ingreso, dolares, pago_movil, movi, efectivo, otros, fecha").eq("user_id", user.id),
    supabase.from("mantenimientos_aceite").select("unidad_id, costo_servicio, fecha_servicio").eq("user_id", user.id),
    supabase.from("registros_mantenimiento").select("unidad_id, costo_total, costo_bolivares, tasa_cambio, fecha").eq("user_id", user.id),
    supabase.from("compras_dolares").select("unidad_id, cantidad_dolares, costo_bolivares, tasa_cambio, fecha").eq("user_id", user.id),
  ]);

  const unidades = unidadesRes.data ?? [];
  const rawIngresos = ingresosRes.data ?? [];
  const rawMantenimientos = mantenimientosRes.data ?? [];
  const rawRegistrosMantenimiento = registrosMantenimientoRes.data ?? [];
  const rawComprasDolares = (comprasDolaresRes?.data ?? []) as ComprasDolares[];

  // Aplicar filtros de fecha si se especificaron
  const ingresos = rawIngresos.filter((i) => matchesDateFilter(i.fecha, filter));
  const mantenimientos = rawMantenimientos.filter((m) => matchesDateFilter(m.fecha_servicio, filter));
  const registrosMantenimiento = rawRegistrosMantenimiento.filter((r) => matchesDateFilter(r.fecha, filter));
  const comprasDolares = rawComprasDolares.filter((c) => matchesDateFilter(c.fecha, filter));

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
  const totalIngresos =
    ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0) -
    totalBsUsadosCompras;
  const totalIngresosDolares =
    ingresos.reduce((sum, i) => sum + (Number(i.dolares) || 0), 0) +
    totalDolaresComprados;
  // monto_ingreso ya tiene las deducciones de operador/colector (factor 0.7675)
  const totalIngresosBolivares =
    ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0) -
    totalBsUsadosCompras;
  const totalGastosRepuestos = registrosMantenimiento.reduce((sum, r) => sum + (r.costo_total ?? 0), 0);
  const totalGastosRepuestosBs = registrosMantenimiento.reduce((sum, r) => {
    if (r.costo_bolivares) return sum + Number(r.costo_bolivares);
    if (r.tasa_cambio && r.costo_total) return sum + (Number(r.costo_total) * Number(r.tasa_cambio));
    return sum;
  }, 0);
  const totalMantenimientoAceite = mantenimientos.reduce((sum, m) => sum + (m.costo_servicio ?? 0), 0);
  const totalManoObra = 0; // ahora está incluido en totalGastosRepuestos
  
  const rentabilidadDolares = totalIngresosDolares - totalGastosRepuestos;
  const rentabilidadBolivares = totalIngresosBolivares - totalGastosRepuestosBs;
  const rentabilidadNeta = rentabilidadDolares;

  // Desglose por unidad
  const resumenPorUnidad: ResumenPorUnidad[] = unidades.map((u) => {
    const uid = u.id;
    const uIngresosList = ingresos.filter((i) => i.unidad_id === uid);
    const uDolaresComprados = comprasDolares
      .filter((c) => c.unidad_id === uid)
      .reduce((s, c) => s + (Number(c.cantidad_dolares) || 0), 0);
    const uBsUsadosCompras = comprasDolares
      .filter((c) => c.unidad_id === uid)
      .reduce(
        (s, c) =>
          s +
          (Number(c.costo_bolivares) ||
            (Number(c.cantidad_dolares) * Number(c.tasa_cambio)) ||
            0),
        0
      );
    const uIngresos =
      uIngresosList.reduce((s, i) => s + (i.monto_ingreso ?? 0), 0) -
      uBsUsadosCompras;
    const uIngresosDolares =
      uIngresosList.reduce((s, i) => s + (Number(i.dolares) || 0), 0) +
      uDolaresComprados;
    // monto_ingreso ya tiene deducciones de operador/colector
    const uIngresosBolivares =
      uIngresosList.reduce((s, i) => s + (i.monto_ingreso ?? 0), 0) -
      uBsUsadosCompras;
    const uGastos = registrosMantenimiento.filter((r) => r.unidad_id === uid).reduce((s, r) => s + (r.costo_total ?? 0), 0);
    const uGastosBs = registrosMantenimiento.filter((r) => r.unidad_id === uid).reduce((s, r) => {
      if (r.costo_bolivares) return s + Number(r.costo_bolivares);
      if (r.tasa_cambio && r.costo_total) return s + (Number(r.costo_total) * Number(r.tasa_cambio));
      return s;
    }, 0);
    const uAceite = mantenimientos.filter((m) => m.unidad_id === uid).reduce((s, m) => s + (m.costo_servicio ?? 0), 0);
    const uRentabilidadDolares = uIngresosDolares - uGastos;
    const uRentabilidadBolivares = uIngresosBolivares - uGastosBs;

    return {
      unidad_id: uid,
      placa: u.placa,
      numero_unidad: u.numero_unidad,
      marca: u.marca,
      modelo: u.modelo,
      totalIngresos: uIngresos,
      totalIngresosDolares: uIngresosDolares,
      totalIngresosBolivares: uIngresosBolivares,
      totalGastosRepuestos: uGastos,
      totalGastosRepuestosBs: uGastosBs,
      totalMantenimientoAceite: uAceite,
      totalManoObra: 0,
      rentabilidadDolares: uRentabilidadDolares,
      rentabilidadBolivares: uRentabilidadBolivares,
      rentabilidadNeta: uRentabilidadDolares,
      totalDolaresComprados: uDolaresComprados,
      totalBsUsadosCompras: uBsUsadosCompras,
    };
  });

  return {
    unidadesCount: unidades.length,
    financialSummary: {
      totalIngresos,
      totalIngresosDolares,
      totalIngresosBolivares,
      totalGastosRepuestos,
      totalGastosRepuestosBs,
      totalMantenimientoAceite,
      totalManoObra,
      rentabilidadDolares,
      rentabilidadBolivares,
      rentabilidadNeta,
      totalDolaresComprados,
      totalBsUsadosCompras,
    },
    resumenPorUnidad,
  };
}
