// ============================================================
// PÁGINA: Cuenta Pendiente de Aprobación
// app/pendiente/page.tsx
// ============================================================

import { signOutAction } from "@/app/actions/auth";
import { Clock, Car, LogOut, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cuenta Pendiente — MantenimientoVehicular",
  description: "Tu cuenta está pendiente de aprobación por el administrador.",
};

export default function PendientePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-900/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-900/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 text-center">
          
          {/* Icono animado */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/30">
            <Clock className="h-10 w-10 text-amber-400 animate-pulse" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Cuenta en Revisión
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tu registro fue exitoso. Un administrador revisará tu cuenta
            y la habilitará próximamente.
          </p>

          {/* Separador */}
          <div className="my-6 border-t border-white/10" />

          {/* Pasos */}
          <div className="space-y-3 text-left mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-300">Registro completado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/30">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-sm text-slate-400">Pendiente de aprobación por el administrador</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <Car className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-600">Acceso al sistema</span>
            </div>
          </div>

          {/* Botón cerrar sesión */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="
                flex w-full items-center justify-center gap-2 rounded-xl
                border border-white/10 bg-white/5 px-4 py-3
                text-sm font-medium text-slate-400
                hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30
                transition-all duration-200
              "
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión e intentar más tarde
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          MantenimientoVehicular © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
