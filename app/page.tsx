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
  Shield,
  Hammer,
  Banknote,
  DollarSign,
} from "lucide-react";
import { getDashboardData, getGlobalDashboardData, getUnidadesUsuario } from "@/app/actions/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase";
import { signOutAction } from "@/app/actions/auth";
import { getPerfilUsuario } from "@/app/actions/admin";
import { FinancialSummaryCard } from "@/components/dashboard/FinancialSummaryCard";
import { UpdateMileageCard } from "@/components/dashboard/UpdateMileageCard";
import { OilChangeWidget } from "@/components/dashboard/OilChangeWidget";
import { OilChangeForm } from "@/components/forms/OilChangeForm";
import { MantenimientoForm } from "@/components/forms/MantenimientoForm";
import { MantenimientoTable } from "@/components/dashboard/MantenimientoTable";
import { GlobalUnitSummaryTable } from "@/components/dashboard/GlobalUnitSummaryTable";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { IncomeTable } from "@/components/dashboard/IncomeTable";
import { ComprasDolaresForm } from "@/components/forms/ComprasDolaresForm";
import { ComprasDolaresTable } from "@/components/dashboard/ComprasDolaresTable";
import { CreateUnitForm } from "@/components/forms/CreateUnitForm";
import { EditUnitForm } from "@/components/forms/EditUnitForm";
import { UnitSwitcher } from "@/components/dashboard/UnitSwitcher";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DateFilterBar } from "@/components/dashboard/DateFilterBar";
import { getAllComprasDolares } from "@/app/actions/dolares";
import type { IngresoUnidad, RegistroMantenimiento, ComprasDolares } from "@/lib/types";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBs(amount: number): string {
  const isNeg = (amount || 0) < 0;
  return (
    (isNeg ? "-Bs. " : "Bs. ") +
    Math.abs(amount || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const formatCurrency = formatUSD;

// Next.js 15: searchParams is a Promise
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    unidad?: string;
    tab?: string;
    fecha?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }>;
}) {
  // 1. Sesión
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "";
  const userInitial = userEmail.charAt(0).toUpperCase();

  // Perfil del usuario (para verificar si es admin y limite)
  const perfil = await getPerfilUsuario();
  const isAdmin = perfil?.rol === "admin";
  const maxUnidades = perfil?.max_unidades ?? 1;

  // 2. Unidades y Params
  const unidades = await getUnidadesUsuario();
  const params = await searchParams;
  const activeTab = params.tab || "resumen";
  const canAddUnit = unidades.length < maxUnidades;

  const dateFilter = {
    fecha: params.fecha,
    fechaInicio: params.fechaInicio,
    fechaFin: params.fechaFin,
  };

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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <a
                href="/admin"
                className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:block">Panel de Admin</span>
              </a>
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
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
  let dashboardData: any;
  let globalData: any;
  let error: string | null = null;
  try {
    if (activeTab === "general" || activeTab === "dolares") {
      globalData = await getGlobalDashboardData(dateFilter);
    } else if (activeTab !== "nueva-unidad") {
      dashboardData = await getDashboardData(activeUnidadId, dateFilter);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Error al cargar datos.";
  }

  // Compras de dólares (tab global para todas las unidades)
  let comprasDolares: ComprasDolares[] = [];
  if (activeTab === "dolares" && !error) {
    comprasDolares = await getAllComprasDolares();
  }

  if (error || (!dashboardData && !globalData && activeTab !== "nueva-unidad")) {
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

  const { 
    unidad, 
    financialSummary, 
    oilChangeStatus, 
    ultimosIngresos,
    ultimosRegistrosMantenimiento,
  } = dashboardData || {};

  // Render principal con Layout (Sidebar + Main)
  return (
    <div className="flex min-h-screen bg-background text-white">
      {/* ===== SIDEBAR (Izquierda) ===== */}
      <Sidebar activeUnidadId={activeUnidadId} isAdmin={isAdmin} />

      {/* ===== CONTENIDO PRINCIPAL (Derecha) ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-[73px]">
            {/* Espaciador para el botón de menú móvil que está en la esquina inferior derecha */}
            <div className="flex items-center md:hidden">
              <span className="font-bold text-lg tracking-tight">Gestión Vehicular</span>
            </div>
            
            {/* Selector de Unidades (Movido a la sección principal) */}

            {/* Derecha: KM + usuario + logout */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* KM actual */}
              {activeTab !== "general" && unidad && (
                <div className="hidden sm:flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
                  <span className="text-sm font-bold text-violet-300">
                    {new Intl.NumberFormat("es-PE").format(unidad.kilometraje_actual)} km
                  </span>
                </div>
              )}

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
            
            {/* Selector de Unidades (Nueva ubicación: debajo del header, full width) */}
            <div className="flex w-full items-center mb-2">
              <UnitSwitcher unidades={unidades} activeUnidadId={activeUnidadId} canAddUnit={canAddUnit} />
            </div>

            {/* Título condicional según la pestaña y Filtros de Fecha */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeTab === "general" && "Resumen Global de Flota"}
                  {activeTab === "dolares" && "Compra de Dólares — Todas las Unidades"}
                  {activeTab === "nueva-unidad" && "Registrar Nuevo Vehículo"}
                  {activeTab === "resumen" && `Resumen: ${unidad?.numero_unidad ? (unidad.numero_unidad.toLowerCase().includes("unidad") ? unidad.numero_unidad : `Unidad ${unidad.numero_unidad}`) : unidad?.placa}`}
                  {activeTab === "aceite" && `Control de Aceite: ${unidad?.numero_unidad || unidad?.placa}`}
                  {activeTab === "repuestos" && `Gestión de Repuestos: ${unidad?.numero_unidad || unidad?.placa}`}
                  {activeTab === "mano-obra" && `Mano de Obra: ${unidad?.numero_unidad || unidad?.placa}`}
                  {activeTab === "ingresos" && `Ingresos Diarios: ${unidad?.numero_unidad || unidad?.placa}`}
                  {activeTab === "datos" && `Datos de la Unidad: ${unidad?.numero_unidad || unidad?.placa}`}
                </h2>
                <p className="mt-1 text-slate-400 text-sm">
                  {activeTab === "general" 
                    ? `Análisis global de ${globalData?.unidadesCount} vehículos asignados.`
                    : activeTab === "dolares"
                    ? `Registro y control global de divisas para todas las unidades (${unidades.length} vehículos).`
                    : activeTab === "nueva-unidad"
                    ? "Agrega los datos de la nueva unidad asignada."
                    : `Vehículo ${unidad?.marca} ${unidad?.modelo} (${unidad?.anio}) · ${unidad?.placa}`
                  }
                </p>
              </div>

              {/* Filtro por fecha única y por rango de fechas */}
              {(activeTab === "general" || activeTab === "resumen") && (
                <div className="shrink-0">
                  <DateFilterBar />
                </div>
              )}
            </div>

            {/* TAB: NUEVA UNIDAD */}
            {activeTab === "nueva-unidad" && (
              <section className="py-6">
                <CreateUnitForm />
              </section>
            )}

            {/* TAB: RESUMEN GENERAL (Todas las unidades) */}
            {activeTab === "general" && globalData && (
              <>
                <section>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Métricas Globales (Toda la Flota)
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <FinancialSummaryCard
                      title="Ingresos en Dólares"
                      amount={globalData.financialSummary.totalIngresosDolares}
                      icon={DollarSign}
                      variant="income"
                      currency="USD"
                      badgeText="Dólares"
                      subtitle={
                        (globalData.financialSummary.totalDolaresComprados ?? 0) > 0
                          ? "Divisas recaudadas y compras ($)"
                          : "Divisas recaudadas ($)"
                      }
                    />
                    <FinancialSummaryCard
                      title="Ingresos en Bolívares"
                      amount={globalData.financialSummary.totalIngresosBolivares}
                      icon={Banknote}
                      variant="income"
                      currency="BS"
                      badgeText="Bolívares"
                      subtitle={
                        (globalData.financialSummary.totalBsUsadosCompras ?? 0) > 0
                          ? "Neto tras compra de divisas"
                          : "Total ingreso registrado"
                      }
                    />
                    <FinancialSummaryCard
                      title="Gastos en Repuestos"
                      amount={globalData.financialSummary.totalGastosRepuestos}
                      icon={ShoppingCart}
                      variant="expense"
                      currency="USD"
                      subtitle="Compras acumuladas"
                    />
                    <FinancialSummaryCard
                      title="Mantenimiento Aceite"
                      amount={globalData.financialSummary.totalMantenimientoAceite}
                      icon={Wrench}
                      variant="maintenance"
                      currency="USD"
                      subtitle="Servicios de todas las unidades"
                    />
                    <FinancialSummaryCard
                      title="Mano de Obra"
                      amount={globalData.financialSummary.totalManoObra}
                      icon={Hammer}
                      variant="labor"
                      currency="USD"
                      subtitle="Servicios mecánicos acumulados"
                    />
                    <FinancialSummaryCard
                      title="Rentabilidad Global"
                      amount={globalData.financialSummary.rentabilidadDolares}
                      icon={BarChart3}
                      variant="profit"
                      currency="USD"
                      badgeText="Neto"
                      secondaryAmount={{
                        label: "En Bolívares",
                        amount: globalData.financialSummary.rentabilidadBolivares,
                        currency: "BS",
                      }}
                      subtitle="Balance de toda la flota"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Desglose del Cálculo Global de Rentabilidad (Dólares y Bolívares)
                  </h3>
                  {/* Fila Dólares */}
                  <div className="flex flex-wrap items-center gap-2.5 text-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 w-24">En Dólares:</span>
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-emerald-300 font-mono font-semibold">
                      {formatUSD(globalData.financialSummary.totalIngresosDolares)}
                    </div>
                    <span className="text-slate-500 font-bold">−</span>
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10">
                      <span className="text-red-300 font-mono font-semibold" title="Repuestos y Mano de Obra ($)">
                        {formatUSD(globalData.financialSummary.totalGastosRepuestos)}
                      </span>
                    </div>
                    <span className="text-slate-500 font-bold">=</span>
                    <div
                      className={`rounded-xl px-3.5 py-1.5 font-mono font-bold text-base ${
                        globalData.financialSummary.rentabilidadDolares >= 0
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                          : "bg-red-500/15 border border-red-500/30 text-red-300"
                      }`}
                    >
                      {formatUSD(globalData.financialSummary.rentabilidadDolares)}
                    </div>
                  </div>

                  {/* Fila Bolívares */}
                  <div className="flex flex-wrap items-center gap-2.5 text-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 w-24">En Bolívares:</span>
                    <div className="rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-cyan-300 font-mono font-semibold">
                      {formatBs(globalData.financialSummary.totalIngresosBolivares)}
                    </div>
                    <span className="text-slate-500 font-bold">−</span>
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10">
                      <span className="text-red-300 font-mono font-semibold" title="Gastos en Bolívares">
                        {formatBs(globalData.financialSummary.totalGastosRepuestosBs ?? 0)}
                      </span>
                    </div>
                    <span className="text-slate-500 font-bold">=</span>
                    <div
                      className={`rounded-xl px-3.5 py-1.5 font-mono font-bold text-base ${
                        globalData.financialSummary.rentabilidadBolivares >= 0
                          ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                          : "bg-red-500/15 border border-red-500/30 text-red-300"
                      }`}
                    >
                      {globalData.financialSummary.rentabilidadBolivares >= 0 ? "+" : ""}
                      {formatBs(globalData.financialSummary.rentabilidadBolivares)}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Resumen Financiero por Unidad
                  </h3>
                  <GlobalUnitSummaryTable resumen={globalData.resumenPorUnidad} />
                </section>
              </>
            )}

            {/* TAB: RESUMEN FINANCIERO */}
            {activeTab === "resumen" && (
              <>
                <section>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Métricas Globales
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <FinancialSummaryCard
                      title="Ingresos en Dólares"
                      amount={financialSummary.totalIngresosDolares}
                      icon={DollarSign}
                      variant="income"
                      currency="USD"
                      badgeText="Dólares"
                      subtitle={
                        (financialSummary.totalDolaresComprados ?? 0) > 0
                          ? "Fletes, pasajes y compras ($)"
                          : "Fletes y pasajes en divisas ($)"
                      }
                    />
                    <FinancialSummaryCard
                      title="Ingresos en Bolívares"
                      amount={financialSummary.totalIngresosBolivares}
                      icon={Banknote}
                      variant="income"
                      currency="BS"
                      badgeText="Bolívares"
                      subtitle={
                        (financialSummary.totalBsUsadosCompras ?? 0) > 0
                          ? "Neto tras compra de divisas"
                          : "Total ingreso registrado"
                      }
                    />
                    <FinancialSummaryCard
                      title="Gastos en Repuestos"
                      amount={financialSummary.totalGastosRepuestos}
                      icon={ShoppingCart}
                      variant="expense"
                      currency="USD"
                      subtitle="Compras acumuladas"
                    />
                    <FinancialSummaryCard
                      title="Mantenimiento Aceite"
                      amount={financialSummary.totalMantenimientoAceite}
                      icon={Wrench}
                      variant="maintenance"
                      currency="USD"
                      subtitle="Cambios realizados"
                    />
                    <FinancialSummaryCard
                      title="Mano de Obra"
                      amount={financialSummary.totalManoObra}
                      icon={Hammer}
                      variant="labor"
                      currency="USD"
                      subtitle="Servicios mecánicos"
                    />
                    <FinancialSummaryCard
                      title="Rentabilidad Neta"
                      amount={financialSummary.rentabilidadDolares}
                      icon={BarChart3}
                      variant="profit"
                      currency="USD"
                      badgeText="Neto"
                      secondaryAmount={{
                        label: "En Bolívares",
                        amount: financialSummary.rentabilidadBolivares,
                        currency: "BS",
                      }}
                      subtitle="Balance de esta unidad"
                    />
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Desglose del Cálculo de Rentabilidad (Dólares y Bolívares)
                    </h3>
                    {/* Fila Dólares */}
                    <div className="flex flex-wrap items-center gap-2.5 text-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 w-24">En Dólares:</span>
                      <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-emerald-300 font-mono font-semibold">
                        {formatUSD(financialSummary.totalIngresosDolares)}
                      </div>
                      <span className="text-slate-500 font-bold">−</span>
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10">
                        <span className="text-red-300 font-mono font-semibold" title="Repuestos y Mano de Obra ($)">
                          {formatUSD(financialSummary.totalGastosRepuestos)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">=</span>
                      <div
                        className={`rounded-xl px-3.5 py-1.5 font-mono font-bold text-base ${
                          financialSummary.rentabilidadDolares >= 0
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/15 border border-red-500/30 text-red-300"
                        }`}
                      >
                        {formatUSD(financialSummary.rentabilidadDolares)}
                      </div>
                    </div>

                    {/* Fila Bolívares */}
                    <div className="flex flex-wrap items-center gap-2.5 text-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 w-24">En Bolívares:</span>
                      <div className="rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-cyan-300 font-mono font-semibold">
                        {formatBs(financialSummary.totalIngresosBolivares)}
                      </div>
                      <span className="text-slate-500 font-bold">−</span>
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10">
                        <span className="text-red-300 font-mono font-semibold" title="Gastos en Bolívares">
                          {formatBs(financialSummary.totalGastosRepuestosBs ?? 0)}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">=</span>
                      <div
                        className={`rounded-xl px-3.5 py-1.5 font-mono font-bold text-base ${
                          financialSummary.rentabilidadBolivares >= 0
                            ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                            : "bg-red-500/15 border border-red-500/30 text-red-300"
                        }`}
                      >
                        {financialSummary.rentabilidadBolivares >= 0 ? "+" : ""}
                        {formatBs(financialSummary.rentabilidadBolivares)}
                      </div>
                    </div>
                  </section>

                  <UpdateMileageCard 
                    unidadId={unidad.id} 
                    kilometrajeActual={unidad.kilometraje_actual} 
                  />
                </div>
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
                    <IncomeTable
                      ingresos={ultimosIngresos as IngresoUnidad[]}
                      totalBsUsadosCompras={financialSummary?.totalBsUsadosCompras ?? 0}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* TAB: REPUESTOS + MANO DE OBRA (combinado) */}
            {activeTab === "repuestos" && (
              <section>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Registrar Mantenimiento
                    </h3>
                    <MantenimientoForm unidad={unidad} />
                  </div>
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Historial de Mantenimientos
                    </h3>
                    <MantenimientoTable
                      registros={ultimosRegistrosMantenimiento as RegistroMantenimiento[]}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* TAB: COMPRA DE DÓLARES (GLOBAL / TODAS LAS UNIDADES) */}
            {activeTab === "dolares" && (
              <section>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Nueva Compra
                    </h3>
                    <ComprasDolaresForm unidades={unidades} unidad={unidad} />
                  </div>
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Historial de Compras (Todas las Unidades)
                    </h3>
                    <ComprasDolaresTable compras={comprasDolares as ComprasDolares[]} />
                  </div>
                </div>
              </section>
            )}

            {/* TAB: DATOS DE LA UNIDAD */}
            {activeTab === "datos" && unidad && (
              <section className="py-6">
                <EditUnitForm unidad={unidad} />
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
