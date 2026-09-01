"use client";

// ============================================================
// COMPONENTE: EditUnitForm — Editar Datos de la Unidad
// components/forms/EditUnitForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { editarUnidadAction } from "@/app/actions/unidades";
import type { ActionResult, Unidad } from "@/lib/types";
import {
  Car,
  Hash,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

interface EditUnitFormProps {
  unidad: Unidad;
}

export function EditUnitForm({ unidad }: EditUnitFormProps) {
  const initialState: ActionResult<Unidad> = { success: false };
  const [state, action, isPending] = useActionState(
    editarUnidadAction,
    initialState
  );

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success && state.data) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state.success, state.data]);

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/30 ring-1 ring-violet-400/30">
          <Car className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Editar Vehículo</h2>
          <p className="text-sm text-slate-400 mt-0.5">Actualiza los datos de tu unidad</p>
        </div>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-300">¡Unidad actualizada con éxito!</p>
          </div>
        </div>
      )}
      {state.error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{state.error}</p>
        </div>
      )}

      <form action={action} className="space-y-5">
        <input type="hidden" name="unidad_id" value={unidad.id} />

        {/* Numero de Unidad */}
        <div className="space-y-1.5">
          <label htmlFor="numero_unidad" className="block text-sm font-medium text-slate-300">
            Número de Unidad <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="numero_unidad"
              name="numero_unidad"
              type="text"
              defaultValue={unidad.numero_unidad}
              placeholder="Ej: UN-001"
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 uppercase
                outline-none transition-all duration-200
                focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        {/* Placa */}
        <div className="space-y-1.5">
          <label htmlFor="placa" className="block text-sm font-medium text-slate-300">
            Placa del Vehículo <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="placa"
              name="placa"
              type="text"
              defaultValue={unidad.placa}
              placeholder="Ej: ABC-123"
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 uppercase
                outline-none transition-all duration-200
                focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Marca */}
          <div className="space-y-1.5">
            <label htmlFor="marca" className="block text-sm font-medium text-slate-300">
              Marca <span className="text-red-400">*</span>
            </label>
            <input
              id="marca"
              name="marca"
              type="text"
              defaultValue={unidad.marca}
              placeholder="Ej: Toyota"
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                px-4 py-3 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200
                focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                hover:border-white/20
              "
            />
          </div>

          {/* Modelo */}
          <div className="space-y-1.5">
            <label htmlFor="modelo" className="block text-sm font-medium text-slate-300">
              Modelo <span className="text-red-400">*</span>
            </label>
            <input
              id="modelo"
              name="modelo"
              type="text"
              defaultValue={unidad.modelo}
              placeholder="Ej: Hilux"
              required
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                px-4 py-3 text-sm text-white placeholder-slate-500
                outline-none transition-all duration-200
                focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                hover:border-white/20
              "
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Año */}
          <div className="space-y-1.5">
            <label htmlFor="anio" className="block text-sm font-medium text-slate-300">
              Año <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="anio"
                name="anio"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                defaultValue={unidad.anio}
                required
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-10 pr-4 py-3 text-sm text-white
                  outline-none transition-all duration-200
                  focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                  hover:border-white/20
                "
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="
            group mt-4 w-full flex items-center justify-center gap-2
            rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
            px-4 py-3.5 text-sm font-bold text-white shadow-lg
            shadow-violet-500/25 transition-all duration-200
            hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40
            focus:outline-none focus:ring-2 focus:ring-violet-500/60
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" />
              Guardar Cambios
            </>
          )}
        </button>
      </form>
    </div>
  );
}
