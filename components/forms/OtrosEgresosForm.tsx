"use client";

// ============================================================
// COMPONENTE: OtrosEgresosForm
// components/forms/OtrosEgresosForm.tsx
// Formulario para registrar egresos adicionales (gastos extra)
// ============================================================

import { useActionState, useEffect, useRef, useState } from "react";
import { registrarOtroEgresoAction } from "@/app/actions/otros_egresos";
import type { ActionResult, OtroEgreso, Unidad } from "@/lib/types";
import { DollarSign, Banknote, CheckCircle2, AlertCircle, Loader2, MinusCircle, Car, CreditCard } from "lucide-react";

const initialState: ActionResult<OtroEgreso> = { success: false };

interface OtrosEgresosFormProps {
  unidad?: Unidad;
  unidades?: Unidad[];
}

export function OtrosEgresosForm({ unidad, unidades = [] }: OtrosEgresosFormProps) {
  const [state, formAction, isPending] = useActionState(
    registrarOtroEgresoAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [financiado, setFinanciado] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setFinanciado(false);
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 ring-1 ring-rose-500/30">
          <MinusCircle className="h-5 w-5 text-rose-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Nuevo Egreso</p>
          <p className="text-xs text-slate-500">Registra un gasto adicional por unidad</p>
        </div>
      </div>

      {/* Selector de Unidad */}
      {unidades.length > 0 ? (
        <div className="space-y-1.5">
          <label htmlFor="oe-unidad_id" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            Unidad Asignada <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Car className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              id="oe-unidad_id"
              name="unidad_id"
              required
              defaultValue={unidad?.id ?? unidades[0]?.id}
              className="w-full rounded-xl border border-white/10 bg-[#0f1117] pl-9 pr-4 py-2.5 text-sm text-white focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all cursor-pointer"
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.numero_unidad ? (u.numero_unidad.toLowerCase().includes("unidad") ? u.numero_unidad : `Unidad ${u.numero_unidad}`) : u.placa} — {u.marca} {u.modelo}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : unidad ? (
        <input type="hidden" name="unidad_id" value={unidad.id} />
      ) : null}

      {/* Feedback de estado */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          ¡Egreso registrado correctamente!
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
        <label htmlFor="oe-concepto" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Concepto <span className="text-red-400">*</span>
        </label>
        <input
          id="oe-concepto"
          name="concepto"
          type="text"
          required
          placeholder="Ej: Pago de impuestos, Seguro, Trámite..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
        />
      </div>

      {/* Toggle Financiado */}
      <div
        onClick={() => setFinanciado(!financiado)}
        className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-all duration-200 select-none ${
          financiado
            ? "border-blue-500/40 bg-blue-500/10"
            : "border-white/10 bg-white/5 hover:bg-white/8"
        }`}
      >
        <input type="hidden" name="financiado" value={financiado ? "true" : "false"} />
        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
          financiado ? "border-blue-400 bg-blue-500" : "border-slate-600 bg-transparent"
        }`}>
          {financiado && <span className="text-white text-xs font-bold">✓</span>}
        </div>
        <CreditCard className={`h-4 w-4 ${financiado ? "text-blue-400" : "text-slate-500"}`} />
        <div>
          <p className={`text-sm font-semibold ${financiado ? "text-blue-300" : "text-slate-300"}`}>
            Financiado
          </p>
          <p className="text-xs text-slate-500">El monto se oculta y aparece en la sección de Financiamiento</p>
        </div>
      </div>

      {/* Tipo de Moneda */}
      <div className={`space-y-1.5 transition-opacity ${financiado ? "opacity-50 pointer-events-none" : ""}`}>
        <label htmlFor="oe-tipo_moneda" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Tipo de Moneda <span className="text-red-400">*</span>
        </label>
        <select
          id="oe-tipo_moneda"
          name="tipo_moneda"
          required
          defaultValue="USD"
          className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
          onChange={(e) => {
            const form = e.currentTarget.closest("form");
            if (!form) return;
            const usdField = form.querySelector<HTMLElement>("#oe-usd-group");
            const bsField  = form.querySelector<HTMLElement>("#oe-bs-group");
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
      <div id="oe-usd-group" className={`space-y-1.5 transition-opacity ${financiado ? "opacity-50 pointer-events-none" : ""}`}>
        <label htmlFor="oe-monto_usd" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Monto en Dólares (USD) {!financiado && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <DollarSign className="h-4 w-4 text-rose-400" />
          </div>
          <input
            id="oe-monto_usd"
            name="monto_usd"
            type="number"
            step="0.01"
            min="0"
            placeholder={financiado ? "Financiado" : "0.00"}
            defaultValue=""
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
          />
        </div>
      </div>

      {/* Monto BS */}
      <div id="oe-bs-group" className={`space-y-1.5 hidden transition-opacity ${financiado ? "opacity-50 pointer-events-none" : ""}`}>
        <label htmlFor="oe-monto_bs" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Monto en Bolívares (Bs) {!financiado && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Banknote className="h-4 w-4 text-orange-400" />
          </div>
          <input
            id="oe-monto_bs"
            name="monto_bs"
            type="number"
            step="0.01"
            min="0"
            placeholder={financiado ? "Financiado" : "0.00"}
            defaultValue=""
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
        </div>
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <label htmlFor="oe-fecha" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Fecha <span className="text-red-400">*</span>
        </label>
        <input
          id="oe-fecha"
          name="fecha"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all [color-scheme:dark]"
        />
      </div>

      {/* Notas (opcional) */}
      <div className="space-y-1.5">
        <label htmlFor="oe-notas" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
          Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          id="oe-notas"
          name="notas"
          rows={2}
          placeholder="Detalles adicionales..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all resize-none"
        />
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <MinusCircle className="h-4 w-4" />
            Registrar Egreso
          </>
        )}
      </button>
    </form>
  );
}

