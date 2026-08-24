"use client";

// ============================================================
// COMPONENTE: SparePartsTable — Historial de Piezas Compradas
// components/dashboard/SparePartsTable.tsx
// ============================================================

import { useState, useTransition } from "react";
import { eliminarGastoRepuestoAction } from "@/app/actions/repuestos";
import type { GastoRepuesto } from "@/lib/types";
import {
  Package,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Store,
  Loader2,
} from "lucide-react";

interface SparePartsTableProps {
  gastos: GastoRepuesto[];
}

const PAGE_SIZE = 8;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SparePartsTable({ gastos }: SparePartsTableProps) {
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(gastos.length / PAGE_SIZE);
  const paginated = gastos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalMonto = gastos.reduce((sum, g) => sum + (g.monto_total ?? 0), 0);

  function handleDelete(id: number) {
    setDeletingId(id);
    startTransition(async () => {
      await eliminarGastoRepuestoAction(id);
      setDeletingId(null);
    });
  }

  if (gastos.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <Package className="h-5 w-5 text-amber-400/60" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-slate-500">No hay repuestos registrados aún.</p>
        <p className="text-xs text-slate-600 mt-1">Usa el formulario para agregar el primero.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-white">
            Historial de Repuestos
          </span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
            {gastos.length}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total acumulado</p>
          <p className="font-mono text-sm font-bold text-amber-300">{formatCurrency(totalMonto)}</p>
        </div>
      </div>

      {/* Tabla — desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Pieza / Repuesto</th>
              <th className="px-3 py-3 text-right">Cant.</th>
              <th className="px-3 py-3 text-right">C. Unit.</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Proveedor</th>
              <th className="px-3 py-3 text-center">Acc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map((gasto) => (
              <tr
                key={gasto.id}
                className="group transition-colors hover:bg-white/3"
              >
                <td className="px-5 py-3">
                  <span className="font-medium text-white">{gasto.concepto}</span>
                  {gasto.notas && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{gasto.notas}</p>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="rounded-lg bg-white/5 px-2 py-0.5 text-xs font-mono text-slate-300">
                    ×{gasto.cantidad}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-400 text-xs">
                  {formatCurrency(gasto.costo_unitario)}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="font-mono font-semibold text-amber-300">
                    {formatCurrency(gasto.monto_total ?? 0)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(gasto.fecha_compra)}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {gasto.proveedor ? (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Store className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{gasto.proveedor}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => handleDelete(gasto.id)}
                    disabled={isPending && deletingId === gasto.id}
                    title="Eliminar registro"
                    className="
                      inline-flex items-center justify-center h-7 w-7 rounded-lg
                      text-slate-600 hover:text-red-400 hover:bg-red-500/10
                      transition-all duration-150 disabled:opacity-40
                    "
                  >
                    {isPending && deletingId === gasto.id ? (
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

      {/* Lista — mobile */}
      <div className="sm:hidden divide-y divide-white/5">
        {paginated.map((gasto) => (
          <div key={gasto.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm truncate">{gasto.concepto}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                ×{gasto.cantidad} × {formatCurrency(gasto.costo_unitario)} · {formatDate(gasto.fecha_compra)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-semibold text-sm text-amber-300">
                {formatCurrency(gasto.monto_total ?? 0)}
              </span>
              <button
                onClick={() => handleDelete(gasto.id)}
                disabled={isPending && deletingId === gasto.id}
                className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {isPending && deletingId === gasto.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <span className="text-xs text-slate-500">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, gastos.length)} de {gastos.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-slate-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
