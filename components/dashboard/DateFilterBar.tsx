"use client";

// ============================================================
// COMPONENTE: DateFilterBar — Filtro por Fecha y Rango de Fechas
// components/dashboard/DateFilterBar.tsx
// ============================================================

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, CalendarRange, RotateCcw, X, Filter } from "lucide-react";

export function DateFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const fecha = searchParams.get("fecha") || "";
  const fechaInicio = searchParams.get("fechaInicio") || "";
  const fechaFin = searchParams.get("fechaFin") || "";

  const hasActiveFilter = Boolean(fecha || fechaInicio || fechaFin);

  // Actualiza los parámetros de la URL preservando los existentes (tab, unidad, etc.)
  function updateParams(newParams: Record<string, string | null>) {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });

    startTransition(() => {
      const qs = current.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Manejar selección de fecha única (Box 1)
  function handleSingleDateChange(value: string) {
    if (!value) {
      updateParams({ fecha: null });
    } else {
      // Al elegir fecha única, limpiamos el rango para evitar conflictos
      updateParams({
        fecha: value,
        fechaInicio: null,
        fechaFin: null,
      });
    }
  }

  // Manejar selección de rango (Box 2)
  function handleRangeChange(tipo: "inicio" | "fin", value: string) {
    // Al elegir rango, limpiamos la fecha única
    if (tipo === "inicio") {
      updateParams({
        fecha: null,
        fechaInicio: value || null,
      });
    } else {
      updateParams({
        fecha: null,
        fechaFin: value || null,
      });
    }
  }

  // Restablecer filtros (volver al total acumulado por defecto)
  function handleReset() {
    updateParams({
      fecha: null,
      fechaInicio: null,
      fechaFin: null,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* ── CUADRO 1: Filtro por fecha única ── */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:border-white/20 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/30">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="hidden sm:inline">Fecha:</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="date"
            value={fecha}
            onChange={(e) => handleSingleDateChange(e.target.value)}
            className="bg-transparent text-xs text-white outline-none cursor-pointer [color-scheme:dark] transition-colors"
            title="Filtrar por fecha específica"
          />
          {fecha && (
            <button
              onClick={() => handleSingleDateChange("")}
              className="ml-1 text-slate-500 hover:text-white transition-colors"
              title="Borrar fecha"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── CUADRO 2: Filtro por rango de fechas (Desde - Hasta) ── */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:border-white/20 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <CalendarRange className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">Rango:</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => handleRangeChange("inicio", e.target.value)}
            placeholder="Desde"
            className="bg-transparent text-xs text-white outline-none cursor-pointer [color-scheme:dark]"
            title="Fecha inicio"
          />
          <span className="text-slate-500 text-xs">—</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => handleRangeChange("fin", e.target.value)}
            placeholder="Hasta"
            className="bg-transparent text-xs text-white outline-none cursor-pointer [color-scheme:dark]"
            title="Fecha fin"
          />
          {(fechaInicio || fechaFin) && (
            <button
              onClick={() => updateParams({ fechaInicio: null, fechaFin: null })}
              className="ml-1 text-slate-500 hover:text-white transition-colors"
              title="Borrar rango"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── BOTÓN: Restablecer / Reset ── */}
      {hasActiveFilter ? (
        <button
          onClick={handleReset}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/30 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
          title="Restablecer filtros y ver el total acumulado"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          <span>Restablecer</span>
        </button>
      ) : (
        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 px-1 py-1">
          <Filter className="h-3 w-3 text-slate-600" />
          <span>Total acumulado</span>
        </div>
      )}
    </div>
  );
}
