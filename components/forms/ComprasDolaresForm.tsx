"use client";

// ============================================================
// COMPONENTE: ComprasDolaresForm — Formulario de Compra de Dólares
// components/forms/ComprasDolaresForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { registrarCompraDolaresAction } from "@/app/actions/dolares";
import type { ActionResult, ComprasDolares, Unidad } from "@/lib/types";
import {
  DollarSign,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  TrendingUp,
  FileText,
  ArrowRightLeft,
  Calculator,
  Banknote,
  Car,
} from "lucide-react";

interface ComprasDolaresFormProps {
  unidad?: Unidad;
  unidades?: Unidad[];
}

const initialState: ActionResult<ComprasDolares> = { success: false };

function formatCurrency(val: number, currency = "BS", locale = "es-VE") {
  if (currency === "USD") {
    return (
      "$" +
      val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  return (
    "Bs " +
    val.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function ComprasDolaresForm({ unidad, unidades }: ComprasDolaresFormProps) {
  const [state, action, isPending] = useActionState(
    registrarCompraDolaresAction,
    initialState
  );

  const [cantidadDolares, setCantidadDolares] = useState(0);
  const [tasaCambio, setTasaCambio] = useState(0);
  const costoBolivares = cantidadDolares * tasaCambio;

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      setCantidadDolares(0);
      setTasaCambio(0);
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/20 ring-1 ring-yellow-500/30">
          <DollarSign className="h-4 w-4 text-yellow-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Registrar Compra de Dólares</h3>
          <p className="text-xs text-slate-500">
            {unidad
              ? `${unidad.numero_unidad || unidad.placa} — ${unidad.marca} ${unidad.modelo}`
              : "Control global de divisas para todas las unidades"}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Compra registrada correctamente.
        </div>
      )}
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input
          type="hidden"
          name="unidad_id"
          value={unidad?.id || (unidades && unidades[0]?.id) || ""}
        />

        {/* Fecha */}
        <div className="space-y-1.5">
          <label htmlFor="fecha-dolares" className="block text-xs font-medium text-slate-400">
            Fecha <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="fecha-dolares"
              name="fecha"
              type="date"
              defaultValue={today}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/40"
            />
          </div>
        </div>

        {/* Calculadora en vivo */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-500/80">
            Detalle de la Compra
          </p>

          {/* Cantidad de dólares + Tasa */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="cantidad_dolares" className="block text-xs font-medium text-yellow-400">
                Cantidad (USD) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-yellow-500" />
                <input
                  id="cantidad_dolares"
                  name="cantidad_dolares"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={cantidadDolares || ""}
                  onChange={(e) => setCantidadDolares(Number(e.target.value) || 0)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all hover:border-white/20 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tasa_cambio" className="block text-xs font-medium text-orange-400">
                Tasa Bs/USD <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-500" />
                <input
                  id="tasa_cambio"
                  name="tasa_cambio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={tasaCambio || ""}
                  onChange={(e) => setTasaCambio(Number(e.target.value) || 0)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all hover:border-white/20 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
                />
              </div>
            </div>
          </div>

          {/* Resumen del costo */}
          <div className="rounded-lg border border-yellow-500/30 bg-black/30 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calculator className="h-3.5 w-3.5 text-yellow-500" />
                Dólares × Tasa
              </span>
              <span className="font-mono text-slate-400">
                ${cantidadDolares.toFixed(2)} × {tasaCambio.toFixed(2)}
              </span>
            </div>

            <div className="h-px bg-yellow-500/20" />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
                <Banknote className="h-3.5 w-3.5" />
                Total en Bolívares (Bs)
              </span>
              <span
                className={`font-mono text-lg font-bold transition-colors ${
                  costoBolivares > 0 ? "text-yellow-300" : "text-slate-600"
                }`}
              >
                Bs {costoBolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {costoBolivares > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Equivalente USD
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {formatCurrency(cantidadDolares, "USD", "en-US")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label htmlFor="notas-dolares" className="block text-xs font-medium text-slate-400">
            Notas <span className="text-slate-600">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
            <textarea
              id="notas-dolares"
              name="notas"
              rows={2}
              placeholder="Ej: Cambio en banco BDV, tipo de cambio paralelo..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none hover:border-white/20 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || cantidadDolares <= 0 || tasaCambio <= 0}
          className="group mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-yellow-500/20 transition-all hover:from-yellow-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Registrar Compra
              {costoBolivares > 0 &&
                ` — Bs ${costoBolivares.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
