"use client";

// ============================================================
// COMPONENTE: GlobalUnitSummaryTable
// components/dashboard/GlobalUnitSummaryTable.tsx
// ============================================================

import { useState } from "react";
import { Car, TrendingUp, TrendingDown, BarChart2, X, DollarSign, Wrench, ShoppingCart, Hammer } from "lucide-react";
import type { ResumenPorUnidad } from "@/app/actions/dashboard";

interface GlobalUnitSummaryTableProps {
  resumen: ResumenPorUnidad[];
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(val);
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
      label: "Ingresos",
      value: row.totalIngresos,
      color: "emerald",
      icon: TrendingUp,
      bar: row.totalIngresos,
    },
    {
      label: "Mantenimiento (Rep + Mano Obra)",
      value: row.totalGastosRepuestos,
      color: "red",
      icon: ShoppingCart,
      bar: row.totalGastosRepuestos,
    },
    {
      label: "Cambios de Aceite",
      value: row.totalMantenimientoAceite,
      color: "amber",
      icon: Wrench,
      bar: row.totalMantenimientoAceite,
    },
    {
      label: "Mano de Obra adicional",
      value: row.totalManoObra,
      color: "orange",
      icon: Hammer,
      bar: row.totalManoObra,
    },
  ];

  const maxBar = Math.max(row.totalIngresos, totalGastos, 1);

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
  };
  const textMap: Record<string, string> = {
    emerald: "text-emerald-300",
    red: "text-red-300",
    amber: "text-amber-300",
    orange: "text-orange-300",
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Fondo oscuro blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel del modal */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e1a] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
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
              const pct = Math.round((item.bar / maxBar) * 100);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Icon className={`h-3.5 w-3.5 ${textMap[item.color]}`} strokeWidth={1.5} />
                      {item.label}
                    </div>
                    <span className={`font-mono text-sm font-bold ${textMap[item.color]}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorMap[item.color]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divisor */}
          <div className="h-px bg-white/10" />

          {/* Totales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Gastos</p>
              <p className="font-mono text-lg font-bold text-red-300">
                {formatCurrency(totalGastos)}
              </p>
            </div>
            <div className={`rounded-xl border p-3 text-center ${
              isPositive
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}>
              <p className="text-xs text-slate-500 mb-1">Rentabilidad Neta</p>
              <div className={`flex items-center justify-center gap-1.5 font-mono text-lg font-bold ${
                isPositive ? "text-emerald-300" : "text-red-300"
              }`}>
                {isPositive
                  ? <TrendingUp className="h-4 w-4" />
                  : <TrendingDown className="h-4 w-4" />
                }
                {formatCurrency(row.rentabilidadNeta)}
              </div>
            </div>
          </div>

          {/* Fórmula */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Cálculo</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-emerald-300 font-bold">{formatCurrency(row.totalIngresos)}</span>
              <span className="text-slate-500">−</span>
              <span className="text-slate-400">(</span>
              <span className="text-red-300">{formatCurrency(row.totalGastosRepuestos)}</span>
              <span className="text-slate-500">+</span>
              <span className="text-amber-300">{formatCurrency(row.totalMantenimientoAceite)}</span>
              <span className="text-slate-500">+</span>
              <span className="text-orange-300">{formatCurrency(row.totalManoObra)}</span>
              <span className="text-slate-400">)</span>
              <span className="text-slate-500">=</span>
              <span className={`font-bold text-base ${isPositive ? "text-violet-300" : "text-red-300"}`}>
                {formatCurrency(row.rentabilidadNeta)}
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
                <th className="px-5 py-4 text-right text-emerald-400/80">Ingresos</th>
                <th className="px-5 py-4 text-right text-red-400/80">Repuestos</th>
                <th className="px-5 py-4 text-right text-amber-400/80">Aceite</th>
                <th className="px-5 py-4 text-right text-orange-400/80">Mano Obra</th>
                <th className="px-5 py-4 text-right text-violet-400/80">Rentabilidad</th>
                <th className="px-5 py-4 text-center text-slate-500">Reporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resumen.map((row) => {
                const isPositive = row.rentabilidadNeta >= 0;
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
                    <td className="px-5 py-4 text-right font-mono text-emerald-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.totalIngresos)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-red-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.totalGastosRepuestos)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-amber-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.totalMantenimientoAceite)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-orange-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.totalManoObra)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono font-bold text-sm ${
                        isPositive
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-300 border border-red-500/30"
                      }`}>
                        {isPositive
                          ? <TrendingUp className="h-3.5 w-3.5" />
                          : <TrendingDown className="h-3.5 w-3.5" />
                        }
                        {formatCurrency(row.rentabilidadNeta)}
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
                <td className="px-5 py-4 text-right font-mono font-bold text-emerald-300 text-sm whitespace-nowrap">
                  {formatCurrency(resumen.reduce((s, r) => s + r.totalIngresos, 0))}
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-red-300 text-sm whitespace-nowrap">
                  {formatCurrency(resumen.reduce((s, r) => s + r.totalGastosRepuestos, 0))}
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-amber-300 text-sm whitespace-nowrap">
                  {formatCurrency(resumen.reduce((s, r) => s + r.totalMantenimientoAceite, 0))}
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-orange-300 text-sm whitespace-nowrap">
                  {formatCurrency(resumen.reduce((s, r) => s + r.totalManoObra, 0))}
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  {(() => {
                    const total = resumen.reduce((s, r) => s + r.rentabilidadNeta, 0);
                    return (
                      <div className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono font-bold text-sm ${
                        total >= 0
                          ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                          : "bg-red-500/15 text-red-300 border border-red-500/30"
                      }`}>
                        {formatCurrency(total)}
                      </div>
                    );
                  })()}
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
