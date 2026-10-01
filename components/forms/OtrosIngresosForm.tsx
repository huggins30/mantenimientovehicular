"use client";

// ============================================================
// COMPONENTE: OtrosIngresosForm
// components/forms/OtrosIngresosForm.tsx
// Formulario para registrar ingresos adicionales (no de transporte)
// ============================================================

import { useActionState, useEffect, useRef } from "react";
import { registrarOtroIngresoAction } from "@/app/actions/otros_ingresos";
import type { ActionResult, OtroIngreso } from "@/lib/types";
import { DollarSign, Banknote, CheckCircle2, AlertCircle, Loader2, PlusCircle } from "lucide-react";

const initialState: ActionResult<OtroIngreso> = { success: false };

export function OtrosIngresosForm() {
  const [state, formAction, isPending] = useActionState(
    registrarOtroIngresoAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // Restore default date
      const dateInput = formRef.current?.querySelector<HTMLInputElement>('input[name="fecha"]');
      if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
    }
  }, [state]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 ring-1 ring-teal-500/30">
          <PlusCircle className="h-5 w-5 text-teal-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Nuevo Ingreso</p>
          <p className="text-xs text-slate-500">Registra un ingreso adicional</p>
        </div>
      </div>

      {/* Feedback de estado */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          ¡Ingreso registrado correctamente!
        </div>
      )}
      {!state.success && state.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Concepto */}
      <div className="space-y-1.5">
        <label htmlFor="oi-concepto" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Concepto <span className="text-red-400">*</span>
        </label>
        <input
          id="oi-concepto"
          name="concepto"
          type="text"
          required
          placeholder="Ej: Alquiler de espacio, Venta de material..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all"
        />
      </div>

      {/* Tipo de Moneda */}
      <div className="space-y-1.5">
        <label htmlFor="oi-tipo_moneda" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Tipo de Moneda <span className="text-red-400">*</span>
        </label>
        <select
          id="oi-tipo_moneda"
          name="tipo_moneda"
          required
          defaultValue="USD"
          className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all"
          onChange={(e) => {
            const form = e.currentTarget.closest("form");
            if (!form) return;
            const usdField = form.querySelector<HTMLElement>("#oi-usd-group");
            const bsField  = form.querySelector<HTMLElement>("#oi-bs-group");
            if (e.currentTarget.value === "USD") {
              usdField?.classList.remove("hidden");
              bsField?.classList.add("hidden");
            } else {
              usdField?.classList.add("hidden");
              bsField?.classList.remove("hidden");
            }
          }}
        >
          <option value="USD">💵 Dólares (USD)</option>
          <option value="BS">🇻🇪 Bolívares (Bs)</option>
        </select>
      </div>

      {/* Monto USD */}
      <div id="oi-usd-group" className="space-y-1.5">
        <label htmlFor="oi-monto_usd" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Monto en Dólares (USD) <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <DollarSign className="h-4 w-4 text-teal-400" />
          </div>
          <input
            id="oi-monto_usd"
            name="monto_usd"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue=""
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all"
          />
        </div>
      </div>

      {/* Monto BS */}
      <div id="oi-bs-group" className="space-y-1.5 hidden">
        <label htmlFor="oi-monto_bs" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Monto en Bolívares (Bs) <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Banknote className="h-4 w-4 text-cyan-400" />
          </div>
          <input
            id="oi-monto_bs"
            name="monto_bs"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            defaultValue=""
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <label htmlFor="oi-fecha" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Fecha <span className="text-red-400">*</span>
        </label>
        <input
          id="oi-fecha"
          name="fecha"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all [color-scheme:dark]"
        />
      </div>

      {/* Notas (opcional) */}
      <div className="space-y-1.5">
        <label htmlFor="oi-notas" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          id="oi-notas"
          name="notas"
          rows={2}
          placeholder="Detalles adicionales..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all resize-none"
        />
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4" />
            Registrar Ingreso
          </>
        )}
      </button>
    </form>
  );
}
