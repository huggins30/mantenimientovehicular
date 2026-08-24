"use client";

// ============================================================
// COMPONENTE: SparePartsForm — Registro de Gastos en Piezas
// components/forms/SparePartsForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { registrarGastoRepuestoAction } from "@/app/actions/repuestos";
import type { ActionResult, GastoRepuesto, Unidad } from "@/lib/types";
import {
  Package,
  Hash,
  DollarSign,
  CalendarDays,
  Store,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Plus,
} from "lucide-react";

interface SparePartsFormProps {
  unidad: Unidad;
}

const initialState: ActionResult<GastoRepuesto> = { success: false };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function SparePartsForm({ unidad }: SparePartsFormProps) {
  const [state, action, isPending] = useActionState(
    registrarGastoRepuestoAction,
    initialState
  );

  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState(0);
  const montoTotal = cantidad * costoUnitario;

  // Auto-limpiar el feedback de éxito después de 4s
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30">
          <Package className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Registrar Pieza / Repuesto</h3>
          <p className="text-xs text-slate-500">
            {unidad.placa} — {unidad.marca} {unidad.modelo}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Gasto en repuesto registrado correctamente.
        </div>
      )}
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        {/* hidden: unidad_id */}
        <input type="hidden" name="unidad_id" value={unidad.id} />

        {/* Concepto */}
        <div className="space-y-1.5">
          <label htmlFor="concepto" className="block text-xs font-medium text-slate-400">
            Pieza / Repuesto <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="concepto"
              name="concepto"
              type="text"
              placeholder="Ej: Pastillas de freno delanteras"
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200
                focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        {/* Cantidad + Costo unitario */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="cantidad" className="block text-xs font-medium text-slate-400">
              Cantidad <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="cantidad"
                name="cantidad"
                type="number"
                min="1"
                step="1"
                defaultValue={1}
                required
                onChange={(e) => setCantidad(Number(e.target.value) || 0)}
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-9 pr-3 py-2.5 text-sm text-white
                  outline-none transition-all duration-200
                  focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                  hover:border-white/20
                "
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="costo_unitario" className="block text-xs font-medium text-slate-400">
              Costo Unitario (S/) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="costo_unitario"
                name="costo_unitario"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                onChange={(e) => setCostoUnitario(Number(e.target.value) || 0)}
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500
                  outline-none transition-all duration-200
                  focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                  hover:border-white/20
                "
              />
            </div>
          </div>
        </div>

        {/* Monto Total calculado */}
        <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-amber-400/80">
            <Calculator className="h-3.5 w-3.5" />
            <span>Monto Total ({cantidad} × {formatCurrency(costoUnitario)})</span>
          </div>
          <span className="font-mono text-base font-bold text-amber-300">
            {formatCurrency(montoTotal)}
          </span>
        </div>

        {/* Fecha de compra */}
        <div className="space-y-1.5">
          <label htmlFor="fecha_compra" className="block text-xs font-medium text-slate-400">
            Fecha de compra <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="fecha_compra"
              name="fecha_compra"
              type="date"
              defaultValue={today}
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-9 pr-4 py-2.5 text-sm text-white
                outline-none transition-all duration-200
                focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        {/* Proveedor (opcional) */}
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
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200
                focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        {/* Notas (opcional) */}
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
              placeholder="Observaciones adicionales..."
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200 resize-none
                focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="
            group w-full flex items-center justify-center gap-2
            rounded-xl bg-gradient-to-r from-amber-600 to-orange-600
            px-4 py-3 text-sm font-semibold text-white shadow-lg
            shadow-amber-500/20 transition-all duration-200
            hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30
            focus:outline-none focus:ring-2 focus:ring-amber-500/60
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Registrar Gasto en Pieza
            </>
          )}
        </button>
      </form>
    </div>
  );
}
