"use client";

import { Hammer, CalendarDays, AlignLeft } from "lucide-react";
import type { GastoManoObra } from "@/lib/types";

interface ManoObraTableProps {
  gastos: GastoManoObra[];
}

export function ManoObraTable({ gastos }: ManoObraTableProps) {
  if (!gastos || gastos.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/5 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Hammer className="h-8 w-8 text-slate-500" strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 text-sm font-medium text-slate-300">Sin registros</h3>
        <p className="mt-1 text-xs text-slate-500">
          No hay gastos de mano de obra registrados aún.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-black/20 text-xs font-semibold uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Concepto</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4 text-right">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {gastos.map((gasto) => (
              <tr key={gasto.id} className="transition-colors hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                      <AlignLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{gasto.concepto}</p>
                      {gasto.notas && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{gasto.notas}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatDate(gasto.fecha)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-medium text-white whitespace-nowrap">
                  {formatCurrency(gasto.costo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
