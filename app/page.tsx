// ============================================================
// PÁGINA PRINCIPAL — Dashboard
// app/page.tsx — Server Component
// ============================================================

import {
  TrendingUp,
  Wrench,
  ShoppingCart,
  BarChart3,
  CalendarDays,
  LogOut,
  User,
  Package,
} from "lucide-react";
import { getDashboardData, getUnidadesUsuario } from "@/app/actions/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase";
import { signOutAction } from "@/app/actions/auth";
import { FinancialSummaryCard } from "@/components/dashboard/FinancialSummaryCard";
import { OilChangeWidget } from "@/components/dashboard/OilChangeWidget";
import { OilChangeForm } from "@/components/forms/OilChangeForm";
import { SparePartsForm } from "@/components/forms/SparePartsForm";
import { SparePartsTable } from "@/components/dashboard/SparePartsTable";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { IncomeTable } from "@/components/dashboard/IncomeTable";
import { CreateUnitForm } from "@/components/forms/CreateUnitForm";
import { UnitSwitcher } from "@/components/dashboard/UnitSwitcher";
import { Sidebar } from "@/components/dashboard/Sidebar";
import type { GastoRepuesto, IngresoUnidad } from "@/lib/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Next.js 15: searchParams is a Promise
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ unidad?: string; tab?: string }>;
}) {
  // 1. Sesión
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "";
  const userInitial = userEmail.charAt(0).toUpperCase();

  // 2. Unidades y Params
  const unidades = await getUnidadesUsuario();
  const params = await searchParams;
  const activeTab = params.tab || "resumen";

  // HEADER ESTÁNDAR para estado vacío o error
  const ErrorHeader = (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              Gestión Vehicular
            </h1>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );

  // 3. Estado Vacío: Sin unidades
  if (unidades.length === 0) {
    return (
      <main className="min-h-screen bg-background text-white">
        {ErrorHeader}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <CreateUnitForm />
        </div>
      </main>
    );
  }

  // 4. Determinar unidad activa
  let activeUnidadId = unidades[0].id;
  if (params.unidad) {
    const requestedId = Number(params.unidad);
    if (unidades.some((u) => u.id === requestedId)) {
      activeUnidadId = requestedId;
    }
  }

  // 5. Cargar datos del dashboard
  let dashboardData;
  let error: string | null = null;
  try {
    dashboardData = await getDashboardData(activeUnidadId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar datos.";
  }

  if (error || !dashboardData) {
    return (
      <main className="min-h-screen bg-background text-white">
        {ErrorHeader}
        <div className="flex items-center justify-center p-6 mt-10">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
            {error}
          </div>
        </div>
      </main>
    );
  }

  const { unidad, financialSummary, oilChangeStatus, ultimosGastos, ultimosIngresos } = dashboardData;

  // Render principal con Layout (Sidebar + Main)
  return (
    <div className="flex min-h-screen bg-background text-white">
      {/* ===== SIDEBAR (Izquierda) ===== */}
      <Sidebar activeUnidadId={activeUnidadId} />

      {/* ===== CONTENIDO PRINCIPAL (Derecha) ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-[73px]">
            {/* Espaciador para el botón de menú móvil que está en la esquina inferior derecha */}
            <div className="flex items-center md:hidden">
              <span className="font-bold text-lg tracking-tight">Gestión Vehicular</span>
            </div>
            
            {/* Selector de Unidades */}
            <div className="hidden md:flex flex-1 items-center justify-start">
              {unidades.length > 1 ? (
                <UnitSwitcher unidades={unidades} activeUnidadId={activeUnidadId} />
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-slate-300">
                    {unidad.placa} — {unidad.marca} {unidad.modelo}
                  </span>
                </div>
              )}
            </div>

            {/* Derecha: KM + usuario + logout */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* KM actual */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2">
                <CalendarDays className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
                <span className="text-sm font-bold text-violet-300">
                  {new Intl.NumberFormat("es-PE").format(unidad.kilometraje_actual)} km
                </span>
              </div>

              {/* Avatar de usuario */}
              <div
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                title={userEmail}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/50 text-xs font-bold text-violet-200">
                  {userInitial || <User className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden lg:block max-w-[140px] truncate text-xs text-slate-400">
                  {userEmail}
                </span>
              </div>

              {/* Botón de logout */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className="
                    flex h-9 w-9 items-center justify-center rounded-xl
                    border border-white/10 bg-white/5 text-slate-400
                    hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30
                    transition-all duration-200
                  "
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* ÁREA DE TRABAJO DINÁMICA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-10 pb-20 md:pb-0">
            
            {/* Título condicional según la pestaña */}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {activeTab === "resumen" && `Resumen de la Unidad: ${unidad.placa}`}
                {activeTab === "aceite" && `Control de Aceite: ${unidad.placa}`}
                {activeTab === "ingresos" && `Ingresos Diarios: ${unidad.placa}`}
                {activeTab === "repuestos" && `Gestión de Repuestos: ${unidad.placa}`}
              </h2>
              <p className="mt-1 text-slate-400 text-sm">
                Vehículo {unidad.marca} {unidad.modelo} ({unidad.anio})
              </p>
            </div>

            {/* TAB: RESUMEN FINANCIERO */}
            {activeTab === "resumen" && (
              <>
                <section>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Métricas Globales
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FinancialSummaryCard
                      title="Total Ingresos"
                      amount={financialSummary.totalIngresos}
                      icon={TrendingUp}
                      variant="income"
                      subtitle="Fletes y pasajes registrados"
                    />
                    <FinancialSummaryCard
                      title="Gastos en Repuestos"
                      amount={financialSummary.totalGastosRepuestos}
                      icon={ShoppingCart}
                      variant="expense"
                      subtitle="Compras acumuladas"
                    />
                    <FinancialSummaryCard
                      title="Mantenimiento Aceite"
                      amount={financialSummary.totalMantenimientoAceite}
                      icon={Wrench}
                      variant="maintenance"
                      subtitle="Cambios realizados"
                    />
                    <FinancialSummaryCard
                      title="Rentabilidad Neta"
                      amount={financialSummary.rentabilidadNeta}
                      icon={BarChart3}
                      variant="profit"
                      subtitle="Ingresos − Gastos Totales"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                    Desglose del Cálculo de Rentabilidad
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-emerald-300 font-mono font-semibold">
                      {formatCurrency(financialSummary.totalIngresos)}
                    </div>
                    <span className="text-slate-500 font-bold">−</span>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10">
                      <span className="text-slate-400 font-mono">(</span>
                      <span className="text-red-300 font-mono font-semibold" title="Repuestos">
                        {formatCurrency(financialSummary.totalGastosRepuestos)}
                      </span>
                      <span className="text-slate-400 font-mono">+</span>
                      <span className="text-amber-300 font-mono font-semibold" title="Aceite">
                        {formatCurrency(financialSummary.totalMantenimientoAceite)}
                      </span>
                      <span className="text-slate-400 font-mono">)</span>
                    </div>
                    <span className="text-slate-500 font-bold">=</span>
                    <div
                      className={`rounded-xl px-4 py-2 font-mono font-bold text-lg ${
                        financialSummary.rentabilidadNeta >= 0
                          ? "bg-violet-500/15 border border-violet-500/30 text-violet-300 shadow-lg shadow-violet-500/20"
                          : "bg-red-500/15 border border-red-500/30 text-red-300"
                      }`}
                    >
                      {formatCurrency(financialSummary.rentabilidadNeta)}
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* TAB: CONTROL DE ACEITE */}
            {activeTab === "aceite" && (
              <section>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Estado Actual
                      </h3>
                      <OilChangeWidget
                        data={oilChangeStatus}
                        kilometrajeActual={unidad.kilometraje_actual}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Actualizar / Registrar
                    </h3>
                    <OilChangeForm unidad={unidad} />
                  </div>
                </div>
              </section>
            )}

            {/* TAB: INGRESOS DIARIOS */}
            {activeTab === "ingresos" && (
              <section>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Registrar Nuevo Ingreso
                    </h3>
                    <IncomeForm unidad={unidad} />
                  </div>
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Historial de Ingresos
                    </h3>
                    <IncomeTable ingresos={ultimosIngresos as IngresoUnidad[]} />
                  </div>
                </div>
              </section>
            )}

            {/* TAB: REPUESTOS */}
            {activeTab === "repuestos" && (
              <section>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Registrar Nueva Compra
                    </h3>
                    <SparePartsForm unidad={unidad} />
                  </div>
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Historial de Compras
                    </h3>
                    <SparePartsTable gastos={ultimosGastos as GastoRepuesto[]} />
                  </div>
                </div>
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
