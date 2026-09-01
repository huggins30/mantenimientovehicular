"use client";

// ============================================================
// COMPONENTE: MantenimientoForm — Formulario único combinado
// Piezas / Repuesto + Mano de Obra en un solo submit
// components/forms/MantenimientoForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { registrarMantenimientoAction } from "@/app/actions/mantenimiento";
import type { ActionResult, Unidad } from "@/lib/types";
import {
  Package,
  Hammer,
  Hash,
  DollarSign,
  CalendarDays,
  Store,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Save,
} from "lucide-react";

interface MantenimientoFormProps {
  unidad: Unidad;
}

const initialState: ActionResult = { success: false };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function MantenimientoForm({ unidad }: MantenimientoFormProps) {
  const [state, action, isPending] = useActionState(
    registrarMantenimientoAction,
    initialState
  );

  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState(0);
  const [costoMano, setCostoMano] = useState(0);
  const montoRepuesto = cantidad * costoUnitario;
  const totalGeneral = montoRepuesto + costoMano;

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const today = new Date().toISOString().split("T")[0];

  const inputCls = (accent: "amber" | "orange") =>
    `w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 hover:border-white/20 focus:border-${accent}-500/60 focus:ring-1 focus:ring-${accent}-500/40`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
          <Package className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Registrar Mantenimiento</h3>
          <p className="text-xs text-slate-500">
            {unidad.numero_unidad || unidad.placa} — {unidad.marca} {unidad.modelo}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Mantenimiento registrado correctamente.
        </div>
      )}
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        <input type="hidden" name="unidad_id" value={unidad.id} />

        {/* ── Fecha + Proveedor ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="fecha" className="block text-xs font-medium text-slate-400">
              Fecha <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proveedor" className="block text-xs font-medium text-slate-400">
              Proveedor <span className="text-slate-600">(opcional)</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="proveedor"
                name="proveedor"
                type="text"
                placeholder="Ej: Repuestos El Motor"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: Pieza / Repuesto ── */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Pieza / Repuesto
            </span>
          </div>

          {/* Nombre de la pieza */}
          <div className="space-y-1.5">
            <label htmlFor="rep_concepto" className="block text-xs font-medium text-slate-400">
              Nombre de la pieza <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="rep_concepto"
                name="rep_concepto"
                type="text"
                placeholder="Ej: Pastillas de freno delanteras"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Cantidad + Costo unitario */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="rep_cantidad" className="block text-xs font-medium text-slate-400">
                Cantidad <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="rep_cantidad"
                  name="rep_cantidad"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={1}
                  required
                  onChange={(e) => setCantidad(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rep_costo_unitario" className="block text-xs font-medium text-slate-400">
                Costo Unit. (S/) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="rep_costo_unitario"
                  name="rep_costo_unitario"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  onChange={(e) => setCostoUnitario(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Subtotal repuesto */}
          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
              <Calculator className="h-3.5 w-3.5" />
              <span>Subtotal repuesto ({cantidad} × {formatCurrency(costoUnitario)})</span>
            </div>
            <span className="font-mono text-sm font-bold text-amber-300">
              {formatCurrency(montoRepuesto)}
            </span>
          </div>
        </div>

        {/* ── SECCIÓN: Mano de Obra ── */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Hammer className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
              Mano de Obra
            </span>
          </div>

          {/* Concepto */}
          <div className="space-y-1.5">
            <label htmlFor="mo_concepto" className="block text-xs font-medium text-slate-400">
              Descripción del servicio <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Hammer className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="mo_concepto"
                name="mo_concepto"
                type="text"
                placeholder="Ej: Cambio de pastillas de freno"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
          </div>

          {/* Costo mano de obra */}
          <div className="space-y-1.5">
            <label htmlFor="mo_costo" className="block text-xs font-medium text-slate-400">
              Costo Mano de Obra (S/) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="mo_costo"
                name="mo_costo"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                onChange={(e) => setCostoMano(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
          </div>
        </div>

        {/* ── Total General ── */}
        <div className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-violet-400/80">
            <Calculator className="h-3.5 w-3.5" />
            <span>Total del mantenimiento (repuesto + mano de obra)</span>
          </div>
          <span className="font-mono text-base font-bold text-violet-300">
            {formatCurrency(totalGeneral)}
          </span>
        </div>

        {/* ── Notas ── */}
        <div className="space-y-1.5">
          <label htmlFor="notas" className="block text-xs font-medium text-slate-400">
            Notas <span className="text-slate-600">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
            <textarea
              id="notas"
              name="notas"
              rows={2}
              placeholder="Observaciones adicionales del mantenimiento..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Mantenimiento
            </>
          )}
        </button>
      </form>
    </div>
  );
}
