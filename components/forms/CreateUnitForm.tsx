"use client";

// ============================================================
// COMPONENTE: CreateUnitForm — Registro de Nueva Unidad
// components/forms/CreateUnitForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { crearUnidadAction } from "@/app/actions/unidades";
import type { ActionResult, Unidad } from "@/lib/types";
import {
  Car,
  Hash,
  Wrench,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

const initialState: ActionResult<Unidad> = { success: false };

export function CreateUnitForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(
    crearUnidadAction,
    initialState
  );

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success && state.data) {
      setShowSuccess(true);
      // Redirigir al dashboard de esta nueva unidad
      const t = setTimeout(() => {
        router.push(`/?unidad=${state.data?.id}`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state.success, state.data, router]);

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Glow decorativo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/30 ring-1 ring-violet-400/30">
          <Car className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Registrar Vehículo</h2>
          <p className="text-sm text-slate-400 mt-0.5">Añade tu primera unidad para comenzar</p>
        </div>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-300">¡Unidad registrada con éxito!</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Redirigiendo a tu dashboard...</p>
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

        <div className="grid grid-cols-2 gap-4">
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
                defaultValue={new Date().getFullYear()}
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

          {/* Kilometraje Actual */}
          <div className="space-y-1.5">
            <label htmlFor="kilometraje_actual" className="block text-sm font-medium text-slate-300">
              Kilometraje Actual <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="kilometraje_actual"
                name="kilometraje_actual"
                type="number"
                min="0"
                defaultValue={0}
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
          disabled={isPending || showSuccess}
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
              <Plus className="h-5 w-5" />
              Registrar Unidad
            </>
          )}
        </button>
      </form>
    </div>
  );
}
