// ============================================================
// PÁGINA: Panel de Administración
// app/admin/page.tsx — Server Component
// ============================================================

import { redirect } from "next/navigation";
import { getUsuariosAdmin } from "@/app/actions/admin";
import { signOutAction } from "@/app/actions/auth";
import { UsersTable } from "@/components/admin/UsersTable";
import {
  Shield,
  Users,
  LogOut,
  Car,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de Administración — MantenimientoVehicular",
  description: "Gestión de usuarios y asignación de recursos del sistema.",
};

export default async function AdminPage() {
  const result = await getUsuariosAdmin();

  if (!result.success) {
    redirect("/");
  }

  const usuarios = result.data ?? [];

  const totalUsuarios = usuarios.length;
  const habilitados = usuarios.filter((u) => u.habilitado).length;
  const pendientes = usuarios.filter((u) => !u.habilitado).length;
  const totalUnidades = usuarios.reduce(
    (acc, u) => acc + (u.total_unidades ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Fondos decorativos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-violet-900/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-indigo-900/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/30 ring-1 ring-violet-500/40">
              <Shield className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Panel de Administración
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión de usuarios y permisos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Link al dashboard */}
            <a
              href="/"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-200"
            >
              <Car className="h-4 w-4" />
              <span className="hidden sm:block">Dashboard</span>
            </a>

            {/* Cerrar sesión */}
            <form action={signOutAction}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Total usuarios */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-widest">
              <Users className="h-3.5 w-3.5" />
              Registrados
            </div>
            <p className="text-3xl font-bold text-white">{totalUsuarios}</p>
          </div>

          {/* Habilitados */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-500/70 text-xs font-semibold uppercase tracking-widest">
              <CheckCircle className="h-3.5 w-3.5" />
              Habilitados
            </div>
            <p className="text-3xl font-bold text-emerald-400">{habilitados}</p>
          </div>

          {/* Pendientes */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-500/70 text-xs font-semibold uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" />
              Pendientes
            </div>
            <p className="text-3xl font-bold text-amber-400">{pendientes}</p>
          </div>

          {/* Unidades totales */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-violet-500/70 text-xs font-semibold uppercase tracking-widest">
              <Car className="h-3.5 w-3.5" />
              Unidades
            </div>
            <p className="text-3xl font-bold text-violet-400">{totalUnidades}</p>
          </div>
        </div>

        {/* Sección tabla */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Usuarios Registrados</h2>
            <p className="text-slate-500 text-sm mt-1">
              Habilita usuarios y ajusta su límite de unidades. Los cambios se aplican inmediatamente.
            </p>
          </div>

          <UsersTable usuarios={usuarios} />
        </section>
      </main>
    </div>
  );
}
