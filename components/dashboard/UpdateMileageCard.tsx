"use client";

import { useActionState, useEffect, useState } from "react";
import { actualizarKilometrajeAction } from "@/app/actions/unidades";
import type { ActionResult } from "@/lib/types";
import { Gauge, Check, Loader2, AlertCircle } from "lucide-react";

interface UpdateMileageCardProps {
  unidadId: number;
  kilometrajeActual: number;
}

const initialState: ActionResult = { success: false };

export function UpdateMileageCard({ unidadId, kilometrajeActual }: UpdateMileageCardProps) {
  const [state, action, isPending] = useActionState(actualizarKilometrajeAction, initialState);
  const [isEditing, setIsEditing] = useState(false);
  const [kmValue, setKmValue] = useState(kilometrajeActual.toString());

  // Reset local state when kilometrajeActual prop changes
  useEffect(() => {
    setKmValue(kilometrajeActual.toString());
  }, [kilometrajeActual]);

  // Handle successful update
  useEffect(() => {
    if (state.success) {
      setIsEditing(false);
    }
  }, [state.success]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
          <Gauge className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Kilometraje</h3>
          <p className="text-xs text-slate-400">Actualizar odómetro</p>
        </div>
      </div>

      <div className="relative">
        {!isEditing ? (
          <div className="flex items-center justify-between mt-2 bg-black/20 rounded-xl p-3 border border-white/5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {new Intl.NumberFormat("es-PE").format(kilometrajeActual)} <span className="text-sm font-normal text-slate-500">km</span>
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        ) : (
          <form action={action} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="unidad_id" value={unidadId} />
            <div className="relative flex-1">
              <input
                type="number"
                name="kilometraje"
                value={kmValue}
                onChange={(e) => setKmValue(e.target.value)}
                min={kilometrajeActual}
                required
                autoFocus
                className="w-full rounded-xl border border-violet-500/40 bg-black/40 px-3 py-2 text-white font-mono outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setKmValue(kilometrajeActual.toString());
              }}
              disabled={isPending}
              className="text-xs text-slate-400 hover:text-white px-2"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>

      {state.error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-2 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{state.error}</p>
        </div>
      )}
    </div>
  );
}
