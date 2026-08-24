"use client";

// ============================================================
// COMPONENTE: OilChangeForm — Formulario de KM y Cambio de Aceite
// components/forms/OilChangeForm.tsx
// Client Component — usa useActionState para Server Actions
// ============================================================

import { useActionState, useEffect, useState } from "react";
import { Gauge, Droplets, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  actualizarKilometrajeAction,
  registrarCambioAceiteAction,
} from "@/app/actions/unidades";
import type { ActionResult, Unidad } from "@/lib/types";

interface OilChangeFormProps {
  unidad: Unidad;
}

const initialKmState: ActionResult = { success: false };
const initialAceiteState: ActionResult<any> = { success: false };

// -------------------------------------------------------
// Sub-componente: Feedback de acción
// -------------------------------------------------------
function ActionFeedback({ state }: { state: ActionResult<any> }) {
  if (!state.error && !state.success) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        state.success
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          : "bg-red-500/15 text-red-300 border border-red-500/30"
      }`}
    >
      {state.success ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{state.success ? "Operación realizada con éxito." : state.error}</span>
    </div>
  );
}

// -------------------------------------------------------
// Sub-componente: Input field
// -------------------------------------------------------
function FormInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required,
  min,
  step,
  defaultValue,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
  defaultValue?: string | number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        defaultValue={defaultValue}
        className="
          w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5
          text-sm text-white placeholder-slate-500
          outline-none ring-0
          transition-all duration-200
          focus:border-violet-500/60 focus:bg-white/8 focus:ring-1 focus:ring-violet-500/40
          hover:border-white/20
        "
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// -------------------------------------------------------
// Componente Principal
// -------------------------------------------------------
export function OilChangeForm({ unidad }: OilChangeFormProps) {
  const [kmState, kmAction, kmPending] = useActionState(
    actualizarKilometrajeAction,
    initialKmState
  );
  const [aceiteState, aceiteAction, aceitePending] = useActionState(
    registrarCambioAceiteAction,
    initialAceiteState
  );

  // Estado local para mostrar el próximo km calculado dinámicamente
  const [kmServicio, setKmServicio] = useState<number>(unidad.kilometraje_actual);
  const proximoKmCalculado = kmServicio + 5000;

  // Reset el input de km servicio cuando cambia la unidad
  useEffect(() => {
    setKmServicio(unidad.kilometraje_actual);
  }, [unidad.kilometraje_actual]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* ===== SECCIÓN 1: Actualizar Kilometraje ===== */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        {/* Header de sección */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Gauge className="h-5 w-5 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Actualizar Kilometraje</h3>
            <p className="text-xs text-slate-400">
              KM actual:{" "}
              <span className="font-medium text-slate-300">
                {new Intl.NumberFormat("es-PE").format(unidad.kilometraje_actual)} km
              </span>
            </p>
          </div>
        </div>

        <form action={kmAction} className="space-y-4">
          <input type="hidden" name="unidad_id" value={unidad.id} />

          <FormInput
            id="km-actual"
            name="kilometraje"
            label="Nuevo Kilometraje (km)"
            type="number"
            placeholder={`Ej: ${unidad.kilometraje_actual + 500}`}
            required
            min={String(unidad.kilometraje_actual)}
            step="1"
            defaultValue={unidad.kilometraje_actual}
            hint={`Debe ser mayor o igual a ${new Intl.NumberFormat("es-PE").format(unidad.kilometraje_actual)} km`}
          />

          <ActionFeedback state={kmState} />

          <button
            type="submit"
            disabled={kmPending}
            className="
              flex w-full items-center justify-center gap-2 rounded-xl
              bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white
              transition-all duration-200
              hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {kmPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Gauge className="h-4 w-4" />
                Actualizar Kilometraje
              </>
            )}
          </button>
        </form>
      </div>

      {/* ===== SECCIÓN 2: Registrar Cambio de Aceite ===== */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        {/* Header de sección */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Droplets className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Registrar Cambio de Aceite</h3>
            <p className="text-xs text-slate-400">Intervalo estándar: +5,000 km</p>
          </div>
        </div>

        <form action={aceiteAction} className="space-y-4">
          <input type="hidden" name="unidad_id" value={unidad.id} />

          <FormInput
            id="tipo-aceite"
            name="tipo_aceite"
            label="Tipo de Aceite"
            type="text"
            placeholder="Ej: Mobil 1 5W-30 Sintético"
            required
            hint="Marca, viscosidad y tipo (sintético, semi-sintético, mineral)"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* KM del servicio */}
            <div className="space-y-1.5">
              <label htmlFor="km-servicio" className="block text-sm font-medium text-slate-300">
                KM del Servicio <span className="text-red-400">*</span>
              </label>
              <input
                id="km-servicio"
                name="kilometraje_servicio"
                type="number"
                required
                min="0"
                step="1"
                defaultValue={unidad.kilometraje_actual}
                onChange={(e) => setKmServicio(Number(e.target.value) || 0)}
                className="
                  w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5
                  text-sm text-white placeholder-slate-500
                  outline-none ring-0
                  transition-all duration-200
                  focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40
                  hover:border-white/20
                "
              />
            </div>

            {/* Próximo KM (calculado dinámicamente) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Próximo Servicio{" "}
                <span className="text-xs font-normal text-slate-500">(auto)</span>
              </label>
              <div className="
                flex items-center w-full rounded-xl border border-amber-500/30 
                bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300
              ">
                {new Intl.NumberFormat("es-PE").format(proximoKmCalculado)} km
              </div>
              <p className="text-xs text-slate-500">Calculado: km servicio + 5,000</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="costo-servicio"
              name="costo_servicio"
              label="Costo del Servicio (S/.)"
              type="number"
              placeholder="0.00"
              required
              min="0"
              step="0.01"
            />

            <FormInput
              id="fecha-servicio"
              name="fecha_servicio"
              label="Fecha del Servicio"
              type="date"
              defaultValue={today}
            />
          </div>

          <ActionFeedback state={aceiteState} />

          <button
            type="submit"
            disabled={aceitePending}
            className="
              flex w-full items-center justify-center gap-2 rounded-xl
              bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white
              transition-all duration-200
              hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/25
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {aceitePending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Droplets className="h-4 w-4" />
                Registrar Cambio de Aceite
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
