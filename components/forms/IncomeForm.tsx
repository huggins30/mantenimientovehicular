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
  CalendarDays,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Smartphone,
  DollarSign,
  Banknote,
  MoreHorizontal,
  Zap,
  PiggyBank,
  User,
  Calculator,
  Gauge,
  ArrowRightLeft,
} from "lucide-react";

interface IncomeFormProps {
  unidad: Unidad;
}

const initialState: ActionResult<IngresoUnidad> = { success: false };

function formatCurrency(val: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(val);
}

const paymentFields = [
  { name: "pago_movil", label: "Pago Móvil", icon: Smartphone, color: "violet", colSpan: "col-span-2 sm:col-span-1" },
  { name: "movi", label: "Movi", icon: Zap, color: "blue", colSpan: "col-span-2 sm:col-span-1" },
  { name: "dolares", label: "Dólares ($)", icon: DollarSign, color: "emerald", colSpan: "col-span-2 sm:col-span-1" },
  { name: "monto_bs_dolar", label: "Monto en Bs de $", icon: ArrowRightLeft, color: "amber", colSpan: "col-span-2 sm:col-span-1" },
  { name: "total_conversion", label: "Total Conversión", icon: Calculator, color: "emerald", colSpan: "col-span-2", readOnly: true },
  { name: "efectivo", label: "Efectivo", icon: Banknote, color: "teal", colSpan: "col-span-2 sm:col-span-1" },
  { name: "otros", label: "Otros", icon: MoreHorizontal, color: "slate", colSpan: "col-span-2 sm:col-span-1" },
] as const;

const borderColor: Record<string, string> = {
  violet: "focus:border-violet-500/60 focus:ring-violet-500/40",
  blue: "focus:border-blue-500/60 focus:ring-blue-500/40",
  emerald: "focus:border-emerald-500/60 focus:ring-emerald-500/40",
  amber: "focus:border-amber-500/60 focus:ring-amber-500/40",
  teal: "focus:border-teal-500/60 focus:ring-teal-500/40",
  slate: "focus:border-slate-400/60 focus:ring-slate-400/40",
};
const iconColor: Record<string, string> = {
  violet: "text-violet-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  teal: "text-teal-400",
  slate: "text-slate-400",
};

export function IncomeForm({ unidad }: IncomeFormProps) {
  const [state, action, isPending] = useActionState(
    registrarIngresoAction,
    initialState
  );

  // Valores de cada forma de pago para calcular el total en tiempo real
  const [values, setValues] = useState({
    pago_movil: 0,
    movi: 0,
    dolares: 0,
    monto_bs_dolar: 0,
    efectivo: 0,
    otros: 0,
  });

  const totalConversion = (values.dolares || 0) * (values.monto_bs_dolar || 0);
  const total =
    (values.pago_movil || 0) +
    (values.movi || 0) +
    (values.efectivo || 0) +
    (values.otros || 0) +
    totalConversion;

  const ahorroUnidad = total * 0.25;
  const colector = (total - ahorroUnidad) * 0.08;
  const operador = (total - ahorroUnidad - colector) * 0.25;
  const ingresoARegistrar = total - colector - operador;

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      // Resetear valores
      setValues({
        pago_movil: 0,
        movi: 0,
        dolares: 0,
        monto_bs_dolar: 0,
        efectivo: 0,
        otros: 0,
      });
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
          <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Registrar Ingreso</h3>
          <p className="text-xs text-slate-500">
            {unidad.numero_unidad || unidad.placa} — {unidad.marca} {unidad.modelo}
          </p>
        </div>
      </div>

      {/* Feedback */}
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

        {/* Concepto + Fecha + Kilometraje */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="concepto" className="block text-xs font-medium text-slate-400">
              Concepto <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="concepto"
                name="concepto"
                type="text"
                placeholder="Ej: Flete Lima - Ica"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="kilometraje_actual" className="block text-xs font-medium text-slate-400">
              Kilometraje Actual <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="kilometraje_actual"
                name="kilometraje_actual"
                type="number"
                defaultValue={unidad.kilometraje_actual || ""}
                required
                placeholder="Ej: 150000"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="nombre_operador" className="block text-xs font-medium text-slate-400">
              Nombre del Operador
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="nombre_operador"
                name="nombre_operador"
                type="text"
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="nombre_colector" className="block text-xs font-medium text-slate-400">
              Nombre del Colector
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="nombre_colector"
                name="nombre_colector"
                type="text"
                placeholder="Ej: Pedro Gómez"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* ── Formas de Pago ── */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Formas de Pago
          </p>

          <div className="grid grid-cols-2 gap-3">
            {paymentFields.map((field) => {
              const Icon = field.icon;
              const isReadOnly = "readOnly" in field && field.readOnly;
              const currentValue = isReadOnly
                ? (totalConversion > 0 ? totalConversion.toFixed(2) : "")
                : (values[field.name as keyof typeof values] || "");

              return (
                <div key={field.name} className={`space-y-1.5 ${field.colSpan}`}>
                  <div className="flex items-center justify-between">
                    <label htmlFor={field.name} className={`block text-xs font-medium ${iconColor[field.color]}`}>
                      {field.label}
                    </label>
                    {isReadOnly && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {values.dolares > 0 && values.monto_bs_dolar > 0 ? (
                          <span className="text-emerald-400 font-semibold">
                            ${values.dolares} × {values.monto_bs_dolar} Bs
                          </span>
                        ) : values.dolares > 0 ? (
                          <span className="text-amber-400/90">Indica el monto en Bs</span>
                        ) : (
                          "Dólares × Monto en Bs"
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${iconColor[field.color]}`} strokeWidth={1.5} />
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      readOnly={isReadOnly}
                      value={currentValue}
                      onChange={
                        isReadOnly
                          ? undefined
                          : (e) =>
                            setValues((prev) => ({
                              ...prev,
                              [field.name]: Number(e.target.value) || 0,
                            }))
                      }
                      className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all ${isReadOnly
                        ? "border-emerald-500/30 bg-emerald-500/10 font-mono font-semibold text-emerald-300 cursor-default"
                        : `border-white/10 bg-white/5 hover:border-white/20 focus:ring-1 ${borderColor[field.color]}`
                        }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total calculado */}
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Calculator className="h-3.5 w-3.5" />
                Total del Ingreso
              </div>
              <span className={`font-mono text-base font-bold transition-colors ${total > 0 ? "text-emerald-300" : "text-slate-500"}`}>
                {formatCurrency(total)}
              </span>
            </div>

            {total > 0 && (
              <div className="pt-2 mt-1 border-t border-emerald-500/20 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <PiggyBank className="h-3.5 w-3.5 text-blue-400" /> Ahorro Unidad (25%)
                  </p>
                  <p className="font-mono font-semibold text-blue-300">{formatCurrency(ahorroUnidad)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <User className="h-3.5 w-3.5 text-orange-400" /> Colector (8%)
                  </p>
                  <p className="font-mono font-semibold text-orange-300">{formatCurrency(colector)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <User className="h-3.5 w-3.5 text-amber-400" /> Operador (25%)
                  </p>
                  <p className="font-mono font-semibold text-amber-300">{formatCurrency(operador)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
                    <Banknote className="h-3.5 w-3.5 text-emerald-400" /> Ingreso a Registrar
                  </p>
                  <p className="font-mono font-semibold text-emerald-300">{formatCurrency(ingresoARegistrar)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comprobante */}
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
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || total <= 0}
          className="group mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Registrar Ingreso {total > 0 && `— ${formatCurrency(ingresoARegistrar)}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
