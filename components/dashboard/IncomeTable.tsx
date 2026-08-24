"use client";

// ============================================================
// COMPONENTE: IncomeTable — Historial de Ingresos Diarios
// components/dashboard/IncomeTable.tsx
// ============================================================

import { useState, useTransition } from "react";
import { eliminarIngresoAction } from "@/app/actions/ingresos";
import type { IngresoUnidad } from "@/lib/types";
import {
  TrendingUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Loader2,
} from "lucide-react";

interface IncomeTableProps {
  ingresos: IngresoUnidad[];
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

export function IncomeTable({ ingresos }: IncomeTableProps) {
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(ingresos.length / PAGE_SIZE);
  const paginated = ingresos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalMonto = ingresos.reduce((sum, i) => sum + (i.monto_ingreso ?? 0), 0);

  function handleDelete(id: number) {
    setDeletingId(id);
    startTransition(async () => {
      await eliminarIngresoAction(id);
      setDeletingId(null);
    });
  }

  if (ingresos.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <TrendingUp className="h-5 w-5 text-emerald-400/60" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-slate-500">No hay ingresos registrados aún.</p>
        <p className="text-xs text-slate-600 mt-1">Usa el formulario para registrar un flete o viaje.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-white">
            Historial de Ingresos
          </span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
            {ingresos.length}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total acumulado</p>
          <p className="font-mono text-sm font-bold text-emerald-300">{formatCurrency(totalMonto)}</p>
        </div>
      </div>

      {/* Tabla — desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Concepto</th>
              <th className="px-3 py-3 text-left">Comprobante</th>
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-right">Monto</th>
              <th className="px-3 py-3 text-center">Acc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map((ingreso) => (
              <tr
                key={ingreso.id}
                className="group transition-colors hover:bg-white/3"
              >
                <td className="px-5 py-3">
                  <span className="font-medium text-white">{ingreso.concepto}</span>
                </td>
                <td className="px-3 py-3">
                  {ingreso.comprobante ? (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{ingreso.comprobante}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(ingreso.fecha)}
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="font-mono font-semibold text-emerald-300">
                    {formatCurrency(ingreso.monto_ingreso)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => handleDelete(ingreso.id)}
                    disabled={isPending && deletingId === ingreso.id}
                    title="Eliminar registro"
                    className="
                      inline-flex items-center justify-center h-7 w-7 rounded-lg
                      text-slate-600 hover:text-red-400 hover:bg-red-500/10
                      transition-all duration-150 disabled:opacity-40
                    "
                  >
                    {isPending && deletingId === ingreso.id ? (
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
        {paginated.map((ingreso) => (
          <div key={ingreso.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm truncate">{ingreso.concepto}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(ingreso.fecha)} {ingreso.comprobante ? `· Ref: ${ingreso.comprobante}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-semibold text-sm text-emerald-300">
                {formatCurrency(ingreso.monto_ingreso)}
              </span>
              <button
                onClick={() => handleDelete(ingreso.id)}
                disabled={isPending && deletingId === ingreso.id}
                className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {isPending && deletingId === ingreso.id ? (
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
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, ingresos.length)} de {ingresos.length}
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
