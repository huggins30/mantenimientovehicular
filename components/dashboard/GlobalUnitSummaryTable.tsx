"use client";

// ============================================================
// COMPONENTE: GlobalUnitSummaryTable
// components/dashboard/GlobalUnitSummaryTable.tsx
// ============================================================

import { useState } from "react";
import {
  Car,
  TrendingUp,
  TrendingDown,
  BarChart2,
  X,
  DollarSign,
  Wrench,
  ShoppingCart,
  Hammer,
  Banknote,
} from "lucide-react";
import type { ResumenPorUnidad } from "@/app/actions/dashboard";

interface GlobalUnitSummaryTableProps {
  resumen: ResumenPorUnidad[];
}

function formatUSD(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val || 0);
}

function formatBs(val: number) {
  return (
    "Bs. " +
    (val || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ── Modal de Reporte ─────────────────────────────────────────
function ReporteModal({
  row,
  onClose,
}: {
  row: ResumenPorUnidad;
  onClose: () => void;
}) {
  const isPositive = row.rentabilidadNeta >= 0;
  const totalGastos =
    row.totalGastosRepuestos + row.totalMantenimientoAceite + row.totalManoObra;

  const items = [
    {
      label: "Ingresos en Dólares ($)",
      valueText: formatUSD(row.totalIngresosDolares ?? 0),
      color: "emerald",
      icon: DollarSign,
      bar: row.totalIngresosDolares ?? 0,
    },
    {
      label: "Ingresos en Bolívares (Bs)",
      valueText: formatBs(row.totalIngresosBolivares ?? 0),
      color: "cyan",
      icon: Banknote,
      bar: row.totalIngresosBolivares ?? 0,
    },
    {
      label: "Mantenimiento (Rep + Mano Obra)",
      valueText: formatUSD(row.totalGastosRepuestos),
      color: "red",
      icon: ShoppingCart,
      bar: row.totalGastosRepuestos,
    },
    {
      label: "Cambios de Aceite",
      valueText: formatUSD(row.totalMantenimientoAceite),
      color: "amber",
      icon: Wrench,
      bar: row.totalMantenimientoAceite,
    },
    {
      label: "Mano de Obra adicional",
      valueText: formatUSD(row.totalManoObra),
      color: "orange",
      icon: Hammer,
      bar: row.totalManoObra,
    },
  ];

  const maxBar = Math.max(
    row.totalIngresosDolares ?? 0,
    totalGastos,
    1
  );

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
  };
  const textMap: Record<string, string> = {
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    red: "text-red-300",
    amber: "text-amber-300",
    orange: "text-orange-300",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e1a] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
              <Car className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Reporte — {row.placa}
              </h2>
              <p className="text-xs text-slate-500">
                {row.marca} {row.modelo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-5">
          {/* Barras de métricas */}
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = item.icon;
              const pct = Math.min(100, Math.round((item.bar / maxBar) * 100));
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Icon className={`h-3.5 w-3.5 ${textMap[item.color]}`} strokeWidth={1.5} />
                      {item.label}
                    </div>
                    <span className={`font-mono text-sm font-bold ${textMap[item.color]}`}>
                      {item.valueText}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorMap[item.color]}`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-px bg-white/10" />

          {/* Totales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Gastos ($)</p>
              <p className="font-mono text-base font-bold text-red-300">
                {formatUSD(totalGastos)}
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 text-center ${
                (row.rentabilidadDolares ?? 0) >= 0
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <p className="text-xs text-slate-500 mb-1">Rentabilidad USD ($)</p>
              <div
                className={`flex items-center justify-center gap-1 font-mono text-base font-bold ${
                  (row.rentabilidadDolares ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {(row.rentabilidadDolares ?? 0) >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {formatUSD(row.rentabilidadDolares ?? 0)}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-center">
            <p className="text-[11px] text-slate-400 mb-0.5">Rentabilidad Neta en Bolívares (Bs)</p>
            <p className={`font-mono text-base font-bold ${
              (row.rentabilidadBolivares ?? 0) >= 0 ? "text-cyan-300" : "text-red-300"
            }`}>
              {(row.rentabilidadBolivares ?? 0) >= 0 ? "+" : ""}
              {formatBs(row.rentabilidadBolivares ?? 0)}
            </p>
          </div>

          {/* Resumen Ingresos $ y Bs */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Desglose de Ingresos Recaudados
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total en Dólares ($):</span>
              <span className="font-mono font-bold text-emerald-300">
                {formatUSD(row.totalIngresosDolares ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total en Bolívares (Bs):</span>
              <span className="font-mono font-bold text-cyan-300">
                {formatBs(row.totalIngresosBolivares ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tabla Principal ──────────────────────────────────────────
export function GlobalUnitSummaryTable({ resumen }: GlobalUnitSummaryTableProps) {
  const [selectedRow, setSelectedRow] = useState<ResumenPorUnidad | null>(null);

  if (!resumen || resumen.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-10 text-center text-slate-500 text-sm">
        No hay unidades registradas.
      </div>
    );
  }

  const totalDolares = resumen.reduce((s, r) => s + (r.totalIngresosDolares ?? 0), 0);
  const totalBolivares = resumen.reduce((s, r) => s + (r.totalIngresosBolivares ?? 0), 0);

  return (
    <>
      {/* Modal */}
      {selectedRow && (
        <ReporteModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">Unidad</th>
                <th className="px-5 py-4 text-right text-emerald-400/80">Ingresos ($ / Bs)</th>
                <th className="px-5 py-4 text-right text-red-400/80">Repuestos</th>
                <th className="px-5 py-4 text-right text-amber-400/80">Aceite</th>
                <th className="px-5 py-4 text-right text-orange-400/80">Mano Obra</th>
                <th className="px-5 py-4 text-right text-violet-400/80">Rentabilidad ($ / Bs)</th>
                <th className="px-5 py-4 text-center text-slate-500">Reporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resumen.map((row) => {
                const isPositiveUSD = (row.rentabilidadDolares ?? 0) >= 0;
                return (
                  <tr key={row.unidad_id} className="transition-colors hover:bg-white/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                          <Car className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-wide">{row.placa}</p>
                          <p className="text-xs text-slate-500">{row.marca} {row.modelo}</p>
                        </div>
                      </div>
                    </td>

                    {/* Ingresos en Dólares y en Bolívares */}
                    <td className="px-5 py-4 text-right font-mono whitespace-nowrap">
                      <span className="block text-emerald-300 font-bold text-sm">
                        {formatUSD(row.totalIngresosDolares ?? 0)}
                      </span>
                      <span className="block text-cyan-300 font-medium text-xs mt-0.5">
                        {formatBs(row.totalIngresosBolivares ?? 0)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-mono text-red-400 font-medium whitespace-nowrap">
                      {formatUSD(row.totalGastosRepuestos)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-amber-400 font-medium whitespace-nowrap">
                      {formatUSD(row.totalMantenimientoAceite)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-orange-400 font-medium whitespace-nowrap">
                      {formatUSD(row.totalManoObra)}
                    </td>
                    {/* Rentabilidad en Dólares y en Bolívares */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono font-bold text-xs ${
                            isPositiveUSD
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {isPositiveUSD ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatUSD(row.rentabilidadDolares ?? 0)}
                        </div>
                        <span
                          className={`font-mono text-xs font-semibold ${
                            (row.rentabilidadBolivares ?? 0) >= 0 ? "text-cyan-300" : "text-red-300"
                          }`}
                        >
                          {(row.rentabilidadBolivares ?? 0) >= 0 ? "+" : ""}
                          {formatBs(row.rentabilidadBolivares ?? 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedRow(row)}
                        title="Ver reporte de esta unidad"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-all duration-200 hover:bg-violet-500/20 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Fila de TOTALES */}
            <tfoot className="bg-black/30 border-t border-white/10">
              <tr>
                <td className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Total Flota
                </td>

                {/* Totales de Ingresos en Dólares y en Bolívares */}
                <td className="px-5 py-4 text-right font-mono whitespace-nowrap">
                  <span className="block font-bold text-emerald-300 text-sm">
                    {formatUSD(totalDolares)}
                  </span>
                  <span className="block font-bold text-cyan-300 text-xs mt-0.5">
                    {formatBs(totalBolivares)}
                  </span>
                </td>

                <td className="px-5 py-4 text-right font-mono font-bold text-red-300 text-sm whitespace-nowrap">
                  {formatUSD(resumen.reduce((s, r) => s + r.totalGastosRepuestos, 0))}
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-amber-300 text-sm whitespace-nowrap">
                  {formatUSD(resumen.reduce((s, r) => s + r.totalMantenimientoAceite, 0))}
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-orange-300 text-sm whitespace-nowrap">
                  {formatUSD(resumen.reduce((s, r) => s + r.totalManoObra, 0))}
                </td>
                {/* Total Rentabilidad Flota en Dólares y en Bolívares */}
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex flex-col items-end gap-1">
                    {(() => {
                      const totDolares = resumen.reduce((s, r) => s + (r.rentabilidadDolares ?? 0), 0);
                      const totBs = resumen.reduce((s, r) => s + (r.rentabilidadBolivares ?? 0), 0);
                      return (
                        <>
                          <div
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono font-bold text-xs ${
                              totDolares >= 0
                                ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                                : "bg-red-500/15 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {totDolares >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatUSD(totDolares)}
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              totBs >= 0 ? "text-cyan-300" : "text-red-300"
                            }`}
                          >
                            {totBs >= 0 ? "+" : ""}
                            {formatBs(totBs)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-5 py-4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
