"use client";

// ============================================================
// COMPONENTE: OtrosIngresosTable
// components/dashboard/OtrosIngresosTable.tsx
// Tabla de historial de Otros Ingresos con opción de eliminar
// ============================================================

import { useState, useTransition } from "react";
import { eliminarOtroIngresoAction } from "@/app/actions/otros_ingresos";
import type { OtroIngreso } from "@/lib/types";
import { DollarSign, Banknote, Trash2, CalendarDays, FileText, ChevronDown, ChevronUp } from "lucide-react";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatBs(amount: number): string {
  return (
    "Bs. " +
    Math.abs(amount).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface OtrosIngresosTableProps {
  registros: OtroIngreso[];
}

export function OtrosIngresosTable({ registros }: OtrosIngresosTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? registros : registros.slice(0, 8);

  function handleDelete(id: number) {
    if (!confirm("¿Eliminar este registro?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await eliminarOtroIngresoAction(id);
      setDeletingId(null);
    });
  }

  if (registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
          <FileText className="h-6 w-6 text-teal-400" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-slate-400">Sin registros aún</p>
        <p className="text-xs text-slate-600">Los ingresos adicionales aparecerán aquí</p>
      </div>
    );
  }

  // Totales
  const totalUSD = registros
    .filter((r) => r.tipo_moneda === "USD")
    .reduce((s, r) => s + (r.monto_usd ?? 0), 0);
  const totalBS = registros
    .filter((r) => r.tipo_moneda === "BS")
    .reduce((s, r) => s + (r.monto_bs ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* Tarjetas de totales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-3">
          <DollarSign className="h-5 w-5 text-teal-400 shrink-0" />
          <div>
            <p className="text-[10px] text-teal-400/70 font-medium uppercase tracking-wider">Total USD</p>
            <p className="font-mono text-base font-bold text-teal-300">{formatUSD(totalUSD)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
          <Banknote className="h-5 w-5 text-cyan-400 shrink-0" />
          <div>
            <p className="text-[10px] text-cyan-400/70 font-medium uppercase tracking-wider">Total Bs</p>
            <p className="font-mono text-base font-bold text-cyan-300">{formatBs(totalBS)}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Concepto</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Moneda</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Monto</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visible.map((reg) => (
                <tr
                  key={reg.id}
                  className="group transition-colors hover:bg-white/5"
                >
                  {/* Fecha */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-600" strokeWidth={1.5} />
                      <span className="text-xs">{formatDate(reg.fecha)}</span>
                    </div>
                  </td>

                  {/* Concepto */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-white truncate max-w-[180px]" title={reg.concepto}>
                      {reg.concepto}
                    </p>
                    {reg.notas && (
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{reg.notas}</p>
                    )}
                  </td>

                  {/* Tipo moneda badge */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        reg.tipo_moneda === "USD"
                          ? "bg-teal-500/15 text-teal-300 border border-teal-500/20"
                          : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                      }`}
                    >
                      {reg.tipo_moneda === "USD" ? (
                        <DollarSign className="h-3 w-3" />
                      ) : (
                        <Banknote className="h-3 w-3" />
                      )}
                      {reg.tipo_moneda}
                    </span>
                  </td>

                  {/* Monto */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-semibold ${
                        reg.tipo_moneda === "USD" ? "text-teal-300" : "text-cyan-300"
                      }`}
                    >
                      {reg.tipo_moneda === "USD"
                        ? formatUSD(reg.monto_usd)
                        : formatBs(reg.monto_bs)}
                    </span>
                  </td>

                  {/* Eliminar */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(reg.id)}
                      disabled={isPending && deletingId === reg.id}
                      title="Eliminar registro"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ver más / menos */}
      {registros.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Ver todos ({registros.length} registros)
            </>
          )}
        </button>
      )}
    </div>
  );
}
