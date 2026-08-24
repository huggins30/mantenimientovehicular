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
// Fórmula: ingresos - (gastos_repuestos + mantenimientos_aceite)
// -------------------------------------------------------
export async function calcularRentabilidadNeta(
  totalIngresos: number,
  totalGastosRepuestos: number,
  totalMantenimientoAceite: number
): Promise<number> {
  return totalIngresos - (totalGastosRepuestos + totalMantenimientoAceite);
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
  const [unidadRes, ingresosRes, gastosRes, mantenimientosRes] =
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
        .from("gastos_repuestos")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha_compra", { ascending: false }),

      supabase
        .from("mantenimientos_aceite")
        .select("*")
        .eq("unidad_id", unidadId)
        .eq("user_id", user.id)
        .order("fecha_servicio", { ascending: false }),
    ]);

  // Manejar errores de unidad (crítico)
  if (unidadRes.error || !unidadRes.data) {
    throw new Error(
      `Error al cargar la unidad ${unidadId}: ${unidadRes.error?.message ?? "No encontrada o sin acceso"}`
    );
  }

  const unidad: Unidad = unidadRes.data;
  const ingresos = ingresosRes.data ?? [];
  const gastos = gastosRes.data ?? [];
  const mantenimientos = (mantenimientosRes.data ?? []) as MantenimientoAceite[];

  // ---- Cálculos financieros ----
  const totalIngresos = ingresos.reduce(
    (sum, i) => sum + (i.monto_ingreso ?? 0),
    0
  );
  const totalGastosRepuestos = gastos.reduce(
    (sum, g) => sum + (g.monto_total ?? 0),
    0
  );
  const totalMantenimientoAceite = mantenimientos.reduce(
    (sum, m) => sum + (m.costo_servicio ?? 0),
    0
  );
  const rentabilidadNeta = await calcularRentabilidadNeta(
    totalIngresos,
    totalGastosRepuestos,
    totalMantenimientoAceite
  );

  const financialSummary: FinancialSummary = {
    totalIngresos,
    totalGastosRepuestos,
    totalMantenimientoAceite,
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
    ultimosGastos: gastos,       // todos para el módulo de piezas
    ultimosIngresos: ingresos,   // todos para el módulo de ingresos
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
