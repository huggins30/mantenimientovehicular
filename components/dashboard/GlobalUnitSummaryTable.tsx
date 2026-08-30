// ============================================================
// COMPONENTE: GlobalUnitSummaryTable
// components/dashboard/GlobalUnitSummaryTable.tsx
// Tabla resumen financiero por unidad en el dashboard global
// ============================================================

import { Car, TrendingUp, TrendingDown } from "lucide-react";
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

export function GlobalUnitSummaryTable({ resumen }: GlobalUnitSummaryTableProps) {
  if (!resumen || resumen.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-10 text-center text-slate-500 text-sm">
        No hay unidades registradas.
      </div>
    );
  }

  return (
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
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {resumen.map((row) => {
              const isPositive = row.rentabilidadNeta >= 0;
              return (
                <tr key={row.unidad_id} className="transition-colors hover:bg-white/5">
                  {/* Unidad */}
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

                  {/* Ingresos */}
                  <td className="px-5 py-4 text-right font-mono text-emerald-400 font-medium whitespace-nowrap">
                    {formatCurrency(row.totalIngresos)}
                  </td>

                  {/* Repuestos */}
                  <td className="px-5 py-4 text-right font-mono text-red-400 font-medium whitespace-nowrap">
                    {formatCurrency(row.totalGastosRepuestos)}
                  </td>

                  {/* Aceite */}
                  <td className="px-5 py-4 text-right font-mono text-amber-400 font-medium whitespace-nowrap">
                    {formatCurrency(row.totalMantenimientoAceite)}
                  </td>

                  {/* Mano de Obra */}
                  <td className="px-5 py-4 text-right font-mono text-orange-400 font-medium whitespace-nowrap">
                    {formatCurrency(row.totalManoObra)}
                  </td>

                  {/* Rentabilidad */}
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
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
