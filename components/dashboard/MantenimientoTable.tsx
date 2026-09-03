"use client";

// ============================================================
// COMPONENTE: MantenimientoTable — Historial de Mantenimientos
// components/dashboard/MantenimientoTable.tsx
// ============================================================

import { useState } from "react";
import { eliminarRegistroMantenimientoAction } from "@/app/actions/mantenimiento";
import type { RegistroMantenimiento } from "@/lib/types";
import {
  Package,
  Hammer,
  CalendarDays,
  Trash2,
  Store,
  Eye,
  X,
  Calculator,
  Search,
} from "lucide-react";

interface MantenimientoTableProps {
  registros: RegistroMantenimiento[];
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatBs(amount: number) {
  return (
    "Bs. " +
    (amount || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Modal de detalle ─────────────────────────────────────────
function DetalleModal({
  registro,
  onClose,
}: {
  registro: RegistroMantenimiento;
  onClose: () => void;
}) {
  const tasa = registro.tasa_cambio || 0;
  const repBs = tasa > 0 ? registro.rep_subtotal * tasa : 0;
  const moBs = tasa > 0 ? registro.mo_costo * tasa : 0;
  const totalBs = registro.costo_bolivares || (tasa > 0 ? registro.costo_total * tasa : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Fondo blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0e1a] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decorativo */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
              <Package className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Detalle del Mantenimiento</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <CalendarDays className="h-3 w-3" />
                {formatDate(registro.fecha)}
                {registro.proveedor && (
                  <span className="ml-2 flex items-center gap-1">
                    <Store className="h-3 w-3" /> {registro.proveedor}
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
        <div className="px-6 py-5 space-y-4">
          {/* Pieza / Repuesto */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Package className="h-3.5 w-3.5" /> Pieza / Repuesto
            </p>
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span className="text-slate-500">Nombre</span>
              <span className="text-white font-medium text-right">{registro.rep_concepto}</span>
              <span className="text-slate-500">Cantidad</span>
              <span className="text-white font-medium text-right">{registro.rep_cantidad}</span>
              <span className="text-slate-500">Costo unitario</span>
              <span className="text-white font-medium text-right">{formatUSD(registro.rep_costo_unitario)}</span>
              <span className="text-slate-500 font-semibold">Subtotal ($)</span>
              <span className="text-amber-300 font-bold text-right">{formatUSD(registro.rep_subtotal)}</span>
              {repBs > 0 && (
                <>
                  <span className="text-amber-400/80 font-semibold">Monto en Bs</span>
                  <span className="text-amber-200 font-bold font-mono text-right">
                    {formatBs(repBs)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mano de Obra */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Hammer className="h-3.5 w-3.5" /> Mano de Obra
            </p>
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span className="text-slate-500">Concepto</span>
              <span className="text-white font-medium text-right">{registro.mo_concepto}</span>
              <span className="text-slate-500 font-semibold">Costo ($)</span>
              <span className="text-orange-300 font-bold text-right">{formatUSD(registro.mo_costo)}</span>
              {moBs > 0 && (
                <>
                  <span className="text-orange-400/80 font-semibold">Monto en Bs</span>
                  <span className="text-orange-200 font-bold font-mono text-right">
                    {formatBs(moBs)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-violet-400/80">
                <Calculator className="h-3.5 w-3.5" />
                <span>
                  {formatUSD(registro.rep_subtotal)} + {formatUSD(registro.mo_costo)}
                </span>
              </div>
              <span className="font-mono text-base font-bold text-violet-300">
                {formatUSD(registro.costo_total)}
              </span>
            </div>
            {totalBs > 0 && (
              <div className="flex items-center justify-between border-t border-violet-500/20 pt-2">
                <span className="text-xs text-cyan-400/80">
                  Total en Bs {tasa > 0 ? `(× ${tasa.toFixed(2)})` : ""}
                </span>
                <span className="font-mono text-sm font-bold text-cyan-300">
                  {formatBs(totalBs)}
                </span>
              </div>
            )}
          </div>

          {/* Notas */}
          {registro.notas && (
            <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3">
              {registro.notas}
            </p>
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

// ── Tabla ────────────────────────────────────────────────────
export function MantenimientoTable({ registros }: MantenimientoTableProps) {
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroMantenimiento | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    setDeletingId(id);
    await eliminarRegistroMantenimientoAction(id);
    setDeletingId(null);
  };

  if (registros.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-600 mb-3" strokeWidth={1} />
        <p className="text-sm text-slate-500">Sin registros de mantenimiento aún.</p>
      </div>
    );
  }

  const filteredRegistros = registros.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.rep_concepto.toLowerCase().includes(q) ||
      r.mo_concepto.toLowerCase().includes(q) ||
      (r.proveedor && r.proveedor.toLowerCase().includes(q)) ||
      (r.notas && r.notas.toLowerCase().includes(q)) ||
      formatDate(r.fecha).toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Modal */}
      {selectedRegistro && (
        <DetalleModal
          registro={selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
        />
      )}

      {/* Buscador */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por repuesto, mano de obra, proveedor o fecha..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
        />
      </div>

      <div className="space-y-2">
        {filteredRegistros.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-6">
            No se encontraron resultados para "{searchQuery}".
          </p>
        ) : (
          filteredRegistros.map((r) => {
            const tasa = r.tasa_cambio || 0;
            const totalBs = r.costo_bolivares || (tasa > 0 ? r.costo_total * tasa : 0);

            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/[0.07]"
              >
                {/* Fecha */}
                <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-500 min-w-[90px]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(r.fecha)}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 rounded-md px-2 py-0.5 truncate max-w-[130px]">
                    <Package className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.rep_concepto}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 rounded-md px-2 py-0.5 truncate max-w-[130px]">
                    <Hammer className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.mo_concepto}</span>
                  </span>
                </div>

                {/* Total */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-violet-300 text-sm block">
                    {formatUSD(r.costo_total)}
                  </span>
                  {totalBs > 0 && (
                    <span className="font-mono text-[11px] text-cyan-400 block">
                      {formatBs(totalBs)}
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Ojo — abre modal */}
                  <button
                    onClick={() => setSelectedRegistro(r)}
                    title="Ver detalle"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    title="Eliminar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
