"use client";

// ============================================================
// COMPONENTE: IncomeForm — Registro de Ingresos Diarios
// Admite 2 formularios condicionales:
// 1. Unidad Común: Proceso estándar (con Movi, Colector y Operador)
// 2. Fraternidad: Sin Movi, sin Colector, Ahorro 25%, Operador 25% y campo Gastos
// components/forms/IncomeForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import {
  registrarIngresoAction,
  registrarIngresoFraternidadAction,
} from "@/app/actions/ingresos";
import type { ActionResult, IngresoUnidad, IngresoUnidadF, Unidad } from "@/lib/types";
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
  Receipt,
  Sparkles,
  Route,
  ChevronDown,
} from "lucide-react";

interface IncomeFormProps {
  unidad: Unidad;
}

const initialComunState: ActionResult<IngresoUnidad> = { success: false };
const initialFraternidadState: ActionResult<IngresoUnidadF> = { success: false };

function formatCurrency(val: number) {
  return (
    "Bs " +
    val.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const borderColor: Record<string, string> = {
  violet: "focus:border-violet-500/60 focus:ring-violet-500/40",
  blue: "focus:border-blue-500/60 focus:ring-blue-500/40",
  emerald: "focus:border-emerald-500/60 focus:ring-emerald-500/40",
  amber: "focus:border-amber-500/60 focus:ring-amber-500/40",
  teal: "focus:border-teal-500/60 focus:ring-teal-500/40",
  rose: "focus:border-rose-500/60 focus:ring-rose-500/40",
  slate: "focus:border-slate-400/60 focus:ring-slate-400/40",
};

const iconColor: Record<string, string> = {
  violet: "text-violet-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  teal: "text-teal-400",
  rose: "text-rose-400",
  slate: "text-slate-400",
};

// ============================================================
// FORMULARIO 1: UNIDAD COMÚN (Proceso Estándar)
// ============================================================
const paymentFieldsComun = [
  { name: "pago_movil", label: "Pago Móvil", icon: Smartphone, color: "violet", colSpan: "col-span-2 sm:col-span-1" },
  { name: "movi", label: "Movi", icon: Zap, color: "blue", colSpan: "col-span-2 sm:col-span-1" },
  { name: "dolares", label: "Dólares ($)", icon: DollarSign, color: "emerald", colSpan: "col-span-2 sm:col-span-1" },
  { name: "monto_bs_dolar", label: "Monto en Bs de $", icon: ArrowRightLeft, color: "amber", colSpan: "col-span-2 sm:col-span-1" },
  { name: "total_conversion", label: "Total Conversión", icon: Calculator, color: "emerald", colSpan: "col-span-2", readOnly: true },
  { name: "efectivo", label: "Efectivo", icon: Banknote, color: "teal", colSpan: "col-span-2 sm:col-span-1" },
  { name: "otros", label: "Otros", icon: MoreHorizontal, color: "slate", colSpan: "col-span-2 sm:col-span-1" },
] as const;

function IncomeFormComun({ unidad }: IncomeFormProps) {
  const [state, action, isPending] = useActionState(
    registrarIngresoAction,
    initialComunState
  );

  const [values, setValues] = useState({
    pago_movil: 0,
    movi: 0,
    dolares: 0,
    monto_bs_dolar: 0,
    efectivo: 0,
    otros: 0,
  });

  const [nombreColector, setNombreColector] = useState("Sin colector");
  const [tipo, setTipo] = useState<"Ruta" | "Traslado">("Ruta");

  const totalConversion = (values.dolares || 0) * (values.monto_bs_dolar || 0);
  const total =
    (values.pago_movil || 0) +
    (values.movi || 0) +
    (values.efectivo || 0) +
    (values.otros || 0) +
    totalConversion;

  const esSinColector = nombreColector.trim().toLowerCase() === "sin colector";

  // Ruta + Sin Colector → Operador 30%
  // Traslado + Sin Colector → Operador 25%
  // Con Colector → Colector 8%, Operador 25% (sin importar tipo)
  const pctOperadorSinColector = tipo === "Ruta" ? 0.30 : 0.25;

  let ahorroUnidad = 0;
  let colector = 0;
  let operador = 0;
  let ingresoARegistrar = 0;

  if (esSinColector) {
    ahorroUnidad = total * 0.25;
    colector = 0;
    operador = (total - ahorroUnidad) * pctOperadorSinColector;
    ingresoARegistrar = total - colector - operador;
  } else {
    ahorroUnidad = total * 0.25;
    colector = (total - ahorroUnidad) * 0.08;
    operador = (total - ahorroUnidad - colector) * 0.25;
    ingresoARegistrar = total - colector - operador;
  }

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      setValues({
        pago_movil: 0,
        movi: 0,
        dolares: 0,
        monto_bs_dolar: 0,
        efectivo: 0,
        otros: 0,
      });
      setNombreColector("Sin colector");
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-400">
          Unidad Común
        </span>
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
                value={nombreColector}
                onChange={(e) => setNombreColector(e.target.value)}
                placeholder="Ej: Pedro Gómez"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="tipo" className="block text-xs font-medium text-slate-400">
              Tipo
            </label>
            <div className="relative">
              <Route className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "Ruta" | "Traslado")}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 appearance-none cursor-pointer"
              >
                <option value="Traslado" className="bg-[#121226] text-white">Traslado</option>
                <option value="Ruta" className="bg-[#121226] text-white">Ruta</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Formas de Pago ── */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Formas de Pago
          </p>

          <div className="grid grid-cols-2 gap-3">
            {paymentFieldsComun.map((field) => {
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
                    <User className="h-3.5 w-3.5 text-orange-400" /> Colector ({esSinColector ? "0%" : "8%"})
                  </p>
                  <p className="font-mono font-semibold text-orange-300">{formatCurrency(colector)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <User className="h-3.5 w-3.5 text-amber-400" /> Operador ({esSinColector ? (tipo === "Ruta" ? "30%" : "25%") : "25%"})
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
          className="group mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

// ============================================================
// FORMULARIO 2: UNIDAD FRATERNIDAD
// Sin Movi, sin Colector, Operador 30%, campo Gastos
// Guarda en ingresos_unidad_f
// ============================================================
const paymentFieldsFraternidad = [
  { name: "pago_movil", label: "Pago Móvil", icon: Smartphone, color: "violet", colSpan: "col-span-2 sm:col-span-1" },
  { name: "dolares", label: "Dólares ($)", icon: DollarSign, color: "emerald", colSpan: "col-span-2 sm:col-span-1" },
  { name: "monto_bs_dolar", label: "Monto en Bs de $", icon: ArrowRightLeft, color: "amber", colSpan: "col-span-2 sm:col-span-1" },
  { name: "total_conversion", label: "Total Conversión", icon: Calculator, color: "emerald", colSpan: "col-span-2 sm:col-span-1", readOnly: true },
  { name: "efectivo", label: "Efectivo", icon: Banknote, color: "teal", colSpan: "col-span-2 sm:col-span-1" },
  { name: "otros", label: "Otros", icon: MoreHorizontal, color: "slate", colSpan: "col-span-2 sm:col-span-1" },
] as const;

function IncomeFormFraternidad({ unidad }: IncomeFormProps) {
  const [state, action, isPending] = useActionState(
    registrarIngresoFraternidadAction,
    initialFraternidadState
  );

  const [values, setValues] = useState({
    pago_movil: 0,
    dolares: 0,
    monto_bs_dolar: 0,
    efectivo: 0,
    otros: 0,
    gastos: 0,
  });

  const totalConversion = (values.dolares || 0) * (values.monto_bs_dolar || 0);
  const totalRecaudado =
    (values.pago_movil || 0) +
    (values.efectivo || 0) +
    (values.otros || 0) +
    totalConversion;

  // Lógica Fraternidad: Total Bruto - Gastos -> Ahorro 25% -> Operador 25% del remanente -> Ingreso a Registrar = Restante + Ahorro Unidad
  const gastos = values.gastos || 0;
  const baseCalculo = Math.max(0, totalRecaudado - gastos);
  const ahorroUnidad = baseCalculo * 0.25;
  const remanente = baseCalculo - ahorroUnidad;
  const operador = remanente * 0.25;
  const restante = remanente - operador;
  const ingresoARegistrar = Math.max(0, restante + ahorroUnidad);

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      setValues({
        pago_movil: 0,
        dolares: 0,
        monto_bs_dolar: 0,
        efectivo: 0,
        otros: 0,
        gastos: 0,
      });
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-white/5 p-5 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/40">
            <Sparkles className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Registrar Ingreso</h3>
            <p className="text-xs text-slate-400">
              {unidad.numero_unidad || unidad.placa} — {unidad.marca} {unidad.modelo}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/20 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
          <Sparkles className="h-3 w-3" />
          Fraternidad
        </span>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Ingreso de Fraternidad registrado correctamente.
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

        {/* Concepto + Fecha + Kilometraje + Operador (SIN COLECTOR) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="concepto_f" className="block text-xs font-medium text-slate-400">
              Concepto <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="concepto_f"
                name="concepto"
                type="text"
                placeholder="Ej: Recorrido Jornada"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="kilometraje_actual_f" className="block text-xs font-medium text-slate-400">
              Kilometraje Actual <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="kilometraje_actual_f"
                name="kilometraje_actual"
                type="number"
                defaultValue={unidad.kilometraje_actual || ""}
                required
                placeholder="Ej: 150000"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="fecha_f" className="block text-xs font-medium text-slate-400">
              Fecha <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="fecha_f"
                name="fecha"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="nombre_operador_f" className="block text-xs font-medium text-slate-400">
              Nombre del Operador
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="nombre_operador_f"
                name="nombre_operador"
                type="text"
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>
        </div>

        {/* ── Formas de Pago (SIN MOVI) ── */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Formas de Pago
          </p>

          <div className="grid grid-cols-2 gap-3">
            {paymentFieldsFraternidad.map((field) => {
              const Icon = field.icon;
              const isReadOnly = "readOnly" in field && field.readOnly;
              const currentValue = isReadOnly
                ? (totalConversion > 0 ? totalConversion.toFixed(2) : "")
                : (values[field.name as keyof typeof values] || "");

              return (
                <div key={field.name} className={`space-y-1.5 ${field.colSpan}`}>
                  <div className="flex items-center justify-between">
                    <label htmlFor={`f_${field.name}`} className={`block text-xs font-medium ${iconColor[field.color]}`}>
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
                      id={`f_${field.name}`}
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

            {/* Campo Gastos adicional para Fraternidad */}
            <div className="space-y-1.5 col-span-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label htmlFor="f_gastos" className="block text-xs font-semibold text-rose-400">
                  Gastos Diarios (Bs)
                </label>
                <span className="text-[10px] text-rose-400/80">Se resta del ingreso bruto antes de calcular %</span>
              </div>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-400" />
                <input
                  id="f_gastos"
                  name="gastos"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={values.gastos || ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      gastos: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 pl-9 pr-3 py-2.5 text-sm font-semibold text-white placeholder-rose-300/40 outline-none transition-all hover:border-rose-500/50 focus:border-rose-500/70 focus:ring-1 focus:ring-rose-500/40"
                />
              </div>
            </div>
          </div>

          {/* Total calculado Fraternidad */}
          <div className="flex flex-col gap-2 rounded-lg border border-violet-500/25 bg-violet-500/10 px-4 py-3 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                <Calculator className="h-3.5 w-3.5 text-violet-400" />
                Total del Ingreso Bruto
              </div>
              <span className={`font-mono text-base font-bold transition-colors ${totalRecaudado > 0 ? "text-violet-200" : "text-slate-500"}`}>
                {formatCurrency(totalRecaudado)}
              </span>
            </div>

            {totalRecaudado > 0 && (
              <div className="pt-2 mt-1 border-t border-violet-500/20 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <Receipt className="h-3.5 w-3.5 text-rose-400" /> Gastos
                  </p>
                  <p className="font-mono font-semibold text-rose-300">-{formatCurrency(gastos)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <PiggyBank className="h-3.5 w-3.5 text-blue-400" /> Ahorro Unidad (25%)
                  </p>
                  <p className="font-mono font-semibold text-blue-300">{formatCurrency(ahorroUnidad)}</p>
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
          <label htmlFor="comprobante_f" className="block text-xs font-medium text-slate-400">
            N° Comprobante <span className="text-slate-600">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="comprobante_f"
              name="comprobante"
              type="text"
              placeholder="Ej: F001-000234"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || totalRecaudado <= 0}
          className="group mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Registrar Ingreso Fraternidad {totalRecaudado > 0 && `— ${formatCurrency(ingresoARegistrar)}`}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL CON CONDICIONAL
// Si es 'Fraternidad' -> IncomeFormFraternidad
// Si es 'Unidad Comun' -> IncomeFormComun
// ============================================================
export function IncomeForm({ unidad }: IncomeFormProps) {
  if (unidad.tipo_unidad === "Fraternidad") {
    return <IncomeFormFraternidad unidad={unidad} />;
  }

  return <IncomeFormComun unidad={unidad} />;
}
