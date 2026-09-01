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
  Eye,
  X,
  Smartphone,
  DollarSign,
  Banknote,
  MoreHorizontal,
  Zap,
  Calculator,
  PiggyBank,
  User,
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

// ── Modal de detalle de pago ─────────────────────────────────
function DetalleIngresoModal({
  ingreso,
  onClose,
}: {
  ingreso: IngresoUnidad;
  onClose: () => void;
}) {
  const paymentRows = [
    { label: "Pago Móvil", value: ingreso.pago_movil ?? 0, icon: Smartphone,     color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
    { label: "Movi",       value: ingreso.movi      ?? 0, icon: Zap,             color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/20"   },
    { label: "Dólares",    value: ingreso.dolares   ?? 0, icon: DollarSign,      color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20"},
    { label: "Efectivo",   value: ingreso.efectivo  ?? 0, icon: Banknote,        color: "text-teal-300",    bg: "bg-teal-500/10",    border: "border-teal-500/20"   },
    { label: "Otros",      value: ingreso.otros     ?? 0, icon: MoreHorizontal,  color: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-500/20"  },
  ];

  const total = ingreso.monto_ingreso ?? 0;
  const maxVal = Math.max(...paymentRows.map((r) => r.value), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0e1a] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
              <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{ingreso.concepto}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="h-3 w-3" />
                {formatDate(ingreso.fecha)}
                {ingreso.comprobante && (
                  <span className="flex items-center gap-1">
                    · <FileText className="h-3 w-3" /> {ingreso.comprobante}
                  </span>
                )}
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
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Desglose por forma de pago
          </p>

          {paymentRows.map((row) => {
            const Icon = row.icon;
            const pct = Math.round((row.value / maxVal) * 100);
            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs ${row.color}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {row.label}
                  </div>
                  <span className={`font-mono text-sm font-bold ${row.value > 0 ? row.color : "text-slate-600"}`}>
                    {formatCurrency(row.value)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${row.value > 0 ? row.bg.replace("bg-", "bg-").replace("/10", "/60") : ""}`}
                    style={{ width: row.value > 0 ? `${pct}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400/80">
              <Calculator className="h-3.5 w-3.5" />
              Total del ingreso
            </div>
            <span className="font-mono text-base font-bold text-emerald-300">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Deducciones calculadas */}
          {(ingreso.ahorro_unidad !== undefined || ingreso.colector !== undefined) && (
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <PiggyBank className="h-3.5 w-3.5 text-blue-400" /> Ahorro (25%)
                </p>
                <p className="font-mono font-semibold text-blue-300 text-sm">
                  {formatCurrency(ingreso.ahorro_unidad ?? (total * 0.25))}
                </p>
              </div>
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                <p className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <User className="h-3.5 w-3.5 text-orange-400" /> Colector (8%)
                </p>
                <p className="font-mono font-semibold text-orange-300 text-sm">
                  {formatCurrency(ingreso.colector ?? ((total * 0.75) * 0.08))}
                </p>
              </div>
            </div>
          )}
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

// ── Tabla principal ──────────────────────────────────────────
export function IncomeTable({ ingresos }: IncomeTableProps) {
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIngreso, setSelectedIngreso] = useState<IngresoUnidad | null>(null);
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
    <>
      {/* Modal */}
      {selectedIngreso && (
        <DetalleIngresoModal
          ingreso={selectedIngreso}
          onClose={() => setSelectedIngreso(null)}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-white">Historial de Ingresos</span>
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
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-center">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((ingreso) => (
                <tr key={ingreso.id} className="group transition-colors hover:bg-white/3">
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
                    <div className="flex items-center justify-center gap-1">
                      {/* Ojo — detalle */}
                      <button
                        onClick={() => setSelectedIngreso(ingreso)}
                        title="Ver desglose de pago"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {/* Eliminar */}
                      <button
                        onClick={() => handleDelete(ingreso.id)}
                        disabled={isPending && deletingId === ingreso.id}
                        title="Eliminar registro"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                      >
                        {isPending && deletingId === ingreso.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
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
                  {formatDate(ingreso.fecha)}{ingreso.comprobante ? ` · ${ingreso.comprobante}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-semibold text-sm text-emerald-300">
                  {formatCurrency(ingreso.monto_ingreso)}
                </span>
                <button
                  onClick={() => setSelectedIngreso(ingreso)}
                  className="text-slate-500 hover:text-violet-400 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
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
    </>
  );
}
