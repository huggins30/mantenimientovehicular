"use client";

// ============================================================
// COMPONENTE: ComprasDolaresTable — Historial de compras de dólares
// components/dashboard/ComprasDolaresTable.tsx
// ============================================================

import { useState, useTransition } from "react";
import { eliminarCompraDolaresAction } from "@/app/actions/dolares";
import type { ComprasDolares } from "@/lib/types";
import {
  DollarSign,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  ArrowRightLeft,
  Banknote,
  TrendingUp,
} from "lucide-react";

interface ComprasDolaresTableProps {
  compras: ComprasDolares[];
}

const PAGE_SIZE = 8;

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ComprasDolaresTable({ compras }: ComprasDolaresTableProps) {
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(compras.length / PAGE_SIZE));
  const pageData = compras.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Totales
  const totalDolares = compras.reduce((s, c) => s + c.cantidad_dolares, 0);
  const totalBs      = compras.reduce((s, c) => s + c.costo_bolivares, 0);

  function handleDelete(id: number) {
    setDeletingId(id);
    startTransition(async () => {
      await eliminarCompraDolaresAction(id);
      setDeletingId(null);
    });
  }

  if (compras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 ring-1 ring-yellow-500/20">
          <DollarSign className="h-6 w-6 text-yellow-500/60" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-slate-400">Sin compras registradas</p>
        <p className="text-xs text-slate-600">Registra tu primera compra de dólares.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Resumen global */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20">
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Dólares</p>
            <p className="font-mono font-bold text-yellow-300">
              ${totalDolares.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
            <Banknote className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Gastado (Bs)</p>
            <p className="font-mono font-bold text-orange-300">
              Bs {totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <CalendarDays className="inline h-3.5 w-3.5 mr-1" />Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <DollarSign className="inline h-3.5 w-3.5 mr-1" />USD
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <ArrowRightLeft className="inline h-3.5 w-3.5 mr-1" />Tasa
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Banknote className="inline h-3.5 w-3.5 mr-1" />Total Bs
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pageData.map((compra) => (
                <tr key={compra.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(compra.fecha)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-semibold text-yellow-300">
                      ${compra.cantidad_dolares.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-xs text-orange-300">
                      {compra.tasa_cambio.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-emerald-300">
                      Bs {compra.costo_bolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(compra.id)}
                      disabled={isPending && deletingId === compra.id}
                      className="rounded-lg p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Eliminar"
                    >
                      {isPending && deletingId === compra.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <span className="text-xs text-slate-500">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nota */}
      <p className="text-xs text-slate-600 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Mostrando {compras.length} compra{compras.length !== 1 ? "s" : ""} registrada{compras.length !== 1 ? "s" : ""}.
      </p>
    </div>
  );
}
