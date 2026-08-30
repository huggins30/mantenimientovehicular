"use client";

import { useActionState, useEffect, useState } from "react";
import { registrarGastoManoObraAction } from "@/app/actions/mano_obra";
import type { ActionResult, GastoManoObra } from "@/lib/types";
import {
  Hammer,
  DollarSign,
  CalendarDays,
  AlignLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

interface ManoObraFormProps {
  unidadId: number;
}

const initialState: ActionResult<GastoManoObra> = { success: false };

export function ManoObraForm({ unidadId }: ManoObraFormProps) {
  const [state, action, isPending] = useActionState(registrarGastoManoObraAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl pointer-events-none" />

      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
          <Hammer className="h-6 w-6 text-orange-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Registrar Mano de Obra</h2>
          <p className="text-sm text-slate-400">Añade los gastos por servicios mecánicos</p>
        </div>
      </div>

      {showSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-emerald-300">¡Gasto registrado con éxito!</p>
        </div>
      )}

      {state.error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{state.error}</p>
        </div>
      )}

      <form action={action} className="space-y-5">
        <input type="hidden" name="unidad_id" value={unidadId} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Concepto o Descripción</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              name="concepto"
              type="text"
              required
              placeholder="Ej: Cambio de pastillas de freno"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Costo (S/)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                name="costo"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Fecha</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                name="fecha"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Notas (Opcional)</label>
          <textarea
            name="notas"
            rows={2}
            placeholder="Alguna observación adicional..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-500 transition-all disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="h-5 w-5" /> Guardar Registro</>}
        </button>
      </form>
    </div>
  );
}
