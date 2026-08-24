"use client";

// ============================================================
// COMPONENTE: IncomeForm — Registro de Ingresos Diarios
// components/forms/IncomeForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { registrarIngresoAction } from "@/app/actions/ingresos";
import type { ActionResult, IngresoUnidad, Unidad } from "@/lib/types";
import {
  TrendingUp,
  DollarSign,
  CalendarDays,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

interface IncomeFormProps {
  unidad: Unidad;
}

const initialState: ActionResult<IngresoUnidad> = { success: false };

export function IncomeForm({ unidad }: IncomeFormProps) {
  const [state, action, isPending] = useActionState(
    registrarIngresoAction,
    initialState
  );

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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
          <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Registrar Ingreso</h3>
          <p className="text-xs text-slate-500">
            {unidad.placa} — {unidad.marca} {unidad.modelo}
          </p>
        </div>
      </div>

      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Ingreso registrado correctamente.
        </div>
      )}
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="unidad_id" value={unidad.id} />

        <div className="space-y-1.5">
          <label htmlFor="concepto" className="block text-xs font-medium text-slate-400">
            Concepto del Ingreso <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="concepto"
              name="concepto"
              type="text"
              placeholder="Ej: Flete Lima - Ica"
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200
                focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="monto_ingreso" className="block text-xs font-medium text-slate-400">
              Monto (S/) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="monto_ingreso"
                name="monto_ingreso"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500
                  outline-none transition-all duration-200
                  focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40
                  hover:border-white/20
                "
              />
            </div>
          </div>

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
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-9 pr-4 py-2.5 text-sm text-white
                  outline-none transition-all duration-200
                  focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40
                  hover:border-white/20
                "
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="comprobante" className="block text-xs font-medium text-slate-400">
            N° Comprobante <span className="text-slate-600">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="comprobante"
              name="comprobante"
              type="text"
              placeholder="Ej: F001-000234"
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200
                focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="
            group mt-2 w-full flex items-center justify-center gap-2
            rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600
            px-4 py-3 text-sm font-semibold text-white shadow-lg
            shadow-emerald-500/20 transition-all duration-200
            hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/30
            focus:outline-none focus:ring-2 focus:ring-emerald-500/60
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Registrar Ingreso
            </>
          )}
        </button>
      </form>
    </div>
  );
}
