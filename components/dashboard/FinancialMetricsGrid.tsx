"use client";

// ============================================================
// COMPONENTE: FinancialMetricsGrid
// components/dashboard/FinancialMetricsGrid.tsx
// Grilla interactiva de métricas financieras para el Resumen
// Financiero de la unidad y el Resumen General de la flota.
// Al hacer clic en cualquier tarjeta abre el detalle de movimientos.
// ============================================================

import { useState } from "react";
import {
  DollarSign,
  Banknote,
  ShoppingCart,
  Wrench,
  Hammer,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  CreditCard,
} from "lucide-react";
import { FinancialSummaryCard } from "./FinancialSummaryCard";
import { MovementDetailsModal, type MetricType } from "./MovementDetailsModal";
import type { FinancialSummary, Unidad } from "@/lib/types";

interface FinancialMetricsGridProps {
  summary: FinancialSummary;
  isGlobal: boolean;
  unidad?: Unidad;
  unidades?: Unidad[];
  movimientos: {
    ingresos?: any[];
    registrosMantenimiento?: any[];
    mantenimientos?: any[];
    otrosIngresos?: any[];
    otrosEgresos?: any[];
    comprasDolares?: any[];
    pagosFinanciamiento?: any[];
  };
  resumenPorUnidad?: any[];
}

export function FinancialMetricsGrid({
  summary,
  isGlobal,
  unidad,
  unidades = [],
  movimientos,
  resumenPorUnidad = [],
}: FinancialMetricsGridProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);

  return (
    <>
      {/* Modal de detalle interactivo */}
      <MovementDetailsModal
        isOpen={activeMetric !== null}
        onClose={() => setActiveMetric(null)}
        metricType={activeMetric}
        summary={summary}
        isGlobal={isGlobal}
        unidad={unidad}
        unidades={unidades}
        movimientos={movimientos}
        resumenPorUnidad={resumenPorUnidad}
      />

      {/* Grilla de Tarjetas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Ingresos en Dólares */}
        <FinancialSummaryCard
          title="Ingresos en Dólares"
          amount={summary.totalIngresosDolares}
          icon={DollarSign}
          variant="income"
          currency="USD"
          badgeText="Dólares"
          subtitle={
            (summary.totalDolaresComprados ?? 0) > 0
              ? isGlobal
                ? "Divisas recaudadas y compras ($)"
                : "Fletes, pasajes y compras ($)"
              : isGlobal
              ? "Divisas recaudadas ($)"
              : "Fletes y pasajes en divisas ($)"
          }
          onClick={() => setActiveMetric("ingresos_dolares")}
        />

        {/* 2. Ingresos en Bolívares */}
        <FinancialSummaryCard
          title="Ingresos en Bolívares"
          amount={summary.totalIngresosBolivares}
          icon={Banknote}
          variant="income"
          currency="BS"
          badgeText="Bolívares"
          subtitle={
            (summary.totalBsUsadosCompras ?? 0) > 0
              ? "Neto tras compra de divisas"
              : "Total ingreso registrado en Bs"
          }
          onClick={() => setActiveMetric("ingresos_bolivares")}
        />

        {/* 3. Gastos en Repuestos */}
        <FinancialSummaryCard
          title="Gastos en Repuestos"
          amount={summary.totalGastosRepuestos}
          icon={ShoppingCart}
          variant="expense"
          currency="USD"
          subtitle="Compras acumuladas"
          onClick={() => setActiveMetric("gastos_repuestos")}
        />

        {/* 4. Gastos en Bs Directo */}
        <FinancialSummaryCard
          title="Gastos en Bs (Directo)"
          amount={summary.totalGastosBsDirecto ?? 0}
          icon={Banknote}
          variant="expense"
          currency="BS"
          badgeText="Gastos Bs"
          subtitle="Precio Bs directo acumulado"
          onClick={() => setActiveMetric("gastos_bs_directo")}
        />

        {/* 5. Mantenimiento Aceite */}
        <FinancialSummaryCard
          title="Mantenimiento Aceite"
          amount={summary.totalMantenimientoAceite}
          icon={Wrench}
          variant="maintenance"
          currency="USD"
          subtitle={isGlobal ? "Servicios de todas las unidades" : "Cambios realizados"}
          onClick={() => setActiveMetric("mantenimiento_aceite")}
        />

        {/* 6. Mano de Obra */}
        <FinancialSummaryCard
          title="Mano de Obra"
          amount={summary.totalManoObra}
          icon={Hammer}
          variant="labor"
          currency="USD"
          subtitle={isGlobal ? "Servicios mecánicos acumulados" : "Servicios mecánicos"}
          onClick={() => setActiveMetric("mano_obra")}
        />

        {/* 7. Rentabilidad Neta / Global */}
        <FinancialSummaryCard
          title={isGlobal ? "Rentabilidad Global" : "Rentabilidad Neta"}
          amount={summary.rentabilidadDolares}
          icon={BarChart3}
          variant="profit"
          currency="USD"
          badgeText="Neto"
          secondaryAmount={{
            label: "En Bolívares",
            amount: summary.rentabilidadBolivares,
            currency: "BS",
          }}
          subtitle={isGlobal ? "Balance de toda la flota" : "Balance de esta unidad"}
          onClick={() => setActiveMetric("rentabilidad_dolares")}
        />

        {/* 8. Rentabilidad en Bs */}
        <FinancialSummaryCard
          title="Rentabilidad en Bs"
          amount={summary.rentabilidadBsDirecta ?? 0}
          icon={TrendingUp}
          variant="profit"
          currency="BS"
          badgeText="Bs Neto"
          subtitle="Ingresos Bs − Gastos Bs directos"
          onClick={() => setActiveMetric("rentabilidad_bolivares")}
        />

        {/* 9. Saldos Pendientes */}
        <FinancialSummaryCard
          title="Saldos Pendientes"
          amount={summary.totalSaldoPendiente ?? 0}
          icon={AlertCircle}
          variant="debt"
          currency="USD"
          badgeText="Por Pagar"
          subtitle="Solo de abonos en mantenimiento y repuestos"
          onClick={() => setActiveMetric("saldos_pendientes")}
        />

        {/* 10. Otros Ingresos USD (si hay) */}
        {(summary.totalOtrosIngresosDolares ?? 0) > 0 && (
          <FinancialSummaryCard
            title="Otros Ingresos $"
            amount={summary.totalOtrosIngresosDolares ?? 0}
            icon={Wallet}
            variant="income"
            currency="USD"
            badgeText="Extra"
            subtitle="Ingresos adicionales en USD"
            onClick={() => setActiveMetric("otros_ingresos_usd")}
          />
        )}

        {/* 11. Otros Ingresos Bs (si hay) */}
        {(summary.totalOtrosIngresosBolivares ?? 0) > 0 && (
          <FinancialSummaryCard
            title="Otros Ingresos Bs"
            amount={summary.totalOtrosIngresosBolivares ?? 0}
            icon={Wallet}
            variant="income"
            currency="BS"
            badgeText="Extra"
            subtitle="Ingresos adicionales en Bs"
            onClick={() => setActiveMetric("otros_ingresos_bs")}
          />
        )}

        {/* 12. Otros Egresos USD (si hay) */}
        {(summary.totalOtrosEgresosDolares ?? 0) > 0 && (
          <FinancialSummaryCard
            title="Otros Egresos $"
            amount={summary.totalOtrosEgresosDolares ?? 0}
            icon={TrendingDown}
            variant="expense"
            currency="USD"
            badgeText="Egreso"
            subtitle="Gastos adicionales en USD"
            onClick={() => setActiveMetric("otros_egresos_usd")}
          />
        )}

        {/* 13. Otros Egresos Bs (si hay) */}
        {(summary.totalOtrosEgresosBolivares ?? 0) > 0 && (
          <FinancialSummaryCard
            title="Otros Egresos Bs"
            amount={summary.totalOtrosEgresosBolivares ?? 0}
            icon={TrendingDown}
            variant="expense"
            currency="BS"
            badgeText="Egreso Bs"
            subtitle="Gastos adicionales en Bs"
            onClick={() => setActiveMetric("otros_egresos_bs")}
          />
        )}

        {/* 14. Financiamiento */}
        <FinancialSummaryCard
          title="Financiamiento"
          amount={summary.totalPagosFinanciamientoUSD ?? 0}
          icon={CreditCard}
          variant="credit"
          currency="USD"
          badgeText={
            (summary.totalRegistrosFinanciados ?? 0) > 0
              ? `${summary.totalRegistrosFinanciados} financiado${(summary.totalRegistrosFinanciados ?? 0) > 1 ? "s" : ""}`
              : "Financiado"
          }
          secondaryAmount={
            (summary.totalPagosFinanciamientoBs ?? 0) > 0
              ? {
                  label: "En Bolívares",
                  amount: summary.totalPagosFinanciamientoBs ?? 0,
                  currency: "BS",
                }
              : undefined
          }
          subtitle={
            (summary.totalRegistrosFinanciados ?? 0) > 0
              ? `${summary.totalRegistrosFinanciados} registro(s) activo(s) en financiamiento`
              : "Pagos y abonos en financiamiento"
          }
          onClick={() => setActiveMetric("financiamiento")}
        />
      </div>
    </>
  );
}

