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

// -------------------------------------------------------
// Obtiene todos los datos del Dashboard en paralelo
// Filtra por el usuario autenticado actualmente (via RLS + user_id)
// -------------------------------------------------------
export async function getDashboardData(
  unidadId: number
): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  // Consultas paralelas para máximo rendimiento
  // El RLS de Supabase garantiza que solo se retornan datos del usuario
  const [unidadRes, ingresosRes, mantenimientosRes, registrosMantenimientoRes] =
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
    ]);

  // Manejar errores de unidad (crítico)
  if (unidadRes.error || !unidadRes.data) {
    throw new Error(
      `Error al cargar la unidad ${unidadId}: ${unidadRes.error?.message ?? "No encontrada o sin acceso"}`
    );
  }

  const unidad: Unidad = unidadRes.data;
  const ingresos = ingresosRes.data ?? [];
  const mantenimientos = (mantenimientosRes.data ?? []) as MantenimientoAceite[];
  const registrosMantenimiento = (registrosMantenimientoRes.data ?? []) as RegistroMantenimiento[];

  // ---- Cálculos financieros ----
  const totalIngresos = ingresos.reduce(
    (sum, i) => sum + (i.monto_ingreso ?? 0),
    0
  );
  // Los gastos de mantenimiento (repuesto + mano de obra) ya vienen unidos en costo_total
  const totalGastosMantenimiento = registrosMantenimiento.reduce(
    (sum, r) => sum + (r.costo_total ?? 0),
    0
  );
  const totalMantenimientoAceite = mantenimientos.reduce(
    (sum, m) => sum + (m.costo_servicio ?? 0),
    0
  );

  const rentabilidadNeta = await calcularRentabilidadNeta(
    totalIngresos,
    totalGastosMantenimiento,
    totalMantenimientoAceite,
    0  // ya no hay mano de obra separada
  );

  const financialSummary: FinancialSummary = {
    totalIngresos,
    totalGastosRepuestos: totalGastosMantenimiento, // repuesto + mano de obra unidos
    totalMantenimientoAceite,
    totalManoObra: 0,
    rentabilidadNeta,
  };

  // ---- Estado del semáforo de aceite ----
  const ultimoMantenimiento = mantenimientos[0] ?? null;
  const proximoKilometraje = ultimoMantenimiento?.proximo_kilometraje ?? 0;
  const kmRestantes = proximoKilometraje - unidad.kilometraje_actual;

  const oilStatus = await getOilChangeStatus(
    unidad.kilometraje_actual,
    proximoKilometraje
  );

  const oilChangeStatus: OilChangeStatusData = {
    status: ultimoMantenimiento ? oilStatus : "green",
    kmRestantes: Math.max(kmRestantes, 0),
    proximoKilometraje,
    ultimoServicio: ultimoMantenimiento,
  };

  return {
    unidad,
    financialSummary,
    oilChangeStatus,
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
// Obtiene un resumen global de TODAS las unidades del usuario
// -------------------------------------------------------

export interface ResumenPorUnidad {
  unidad_id: number;
  placa: string;
  marca: string;
  modelo: string;
  totalIngresos: number;
  totalGastosRepuestos: number;
  totalMantenimientoAceite: number;
  totalManoObra: number;
  rentabilidadNeta: number;
}

export async function getGlobalDashboardData(): Promise<{
  financialSummary: FinancialSummary;
  unidadesCount: number;
  resumenPorUnidad: ResumenPorUnidad[];
}> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No estás autenticado. Por favor inicia sesión.");
  }

  const [unidadesRes, ingresosRes, mantenimientosRes, registrosMantenimientoRes] = await Promise.all([
    supabase.from("unidades").select("id, placa, marca, modelo, numero_unidad").eq("user_id", user.id),
    supabase.from("ingresos_unidad").select("unidad_id, monto_ingreso").eq("user_id", user.id),
    supabase.from("mantenimientos_aceite").select("unidad_id, costo_servicio").eq("user_id", user.id),
    supabase.from("registros_mantenimiento").select("unidad_id, costo_total").eq("user_id", user.id),
  ]);

  const unidades = unidadesRes.data ?? [];
  const ingresos = ingresosRes.data ?? [];
  const mantenimientos = mantenimientosRes.data ?? [];
  const registrosMantenimiento = registrosMantenimientoRes.data ?? [];

  // Totales globales
  const totalIngresos = ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0);
  const totalGastosRepuestos = registrosMantenimiento.reduce((sum, r) => sum + (r.costo_total ?? 0), 0);
  const totalMantenimientoAceite = mantenimientos.reduce((sum, m) => sum + (m.costo_servicio ?? 0), 0);
  const totalManoObra = 0; // ahora está incluido en totalGastosRepuestos
  
  const rentabilidadNeta = await calcularRentabilidadNeta(
    totalIngresos,
    totalGastosRepuestos,
    totalMantenimientoAceite,
    totalManoObra
  );

  // Desglose por unidad
  const resumenPorUnidad: ResumenPorUnidad[] = unidades.map((u) => {
    const uid = u.id;
    const uIngresos = ingresos.filter(i => i.unidad_id === uid).reduce((s, i) => s + (i.monto_ingreso ?? 0), 0);
    const uGastos = registrosMantenimiento.filter(r => r.unidad_id === uid).reduce((s, r) => s + (r.costo_total ?? 0), 0);
    const uAceite = mantenimientos.filter(m => m.unidad_id === uid).reduce((s, m) => s + (m.costo_servicio ?? 0), 0);
    const uRentabilidad = uIngresos - (uGastos + uAceite);
    return {
      unidad_id: uid,
      placa: u.placa,
      marca: u.marca,
      modelo: u.modelo,
      totalIngresos: uIngresos,
      totalGastosRepuestos: uGastos,
      totalMantenimientoAceite: uAceite,
      totalManoObra: 0,
      rentabilidadNeta: uRentabilidad,
    };
  });

  return {
    unidadesCount: unidades.length,
    financialSummary: {
      totalIngresos,
      totalGastosRepuestos,
      totalMantenimientoAceite,
      totalManoObra,
      rentabilidadNeta,
    },
    resumenPorUnidad,
  };
}

