// ============================================================
// COMPONENTE: OilChangeWidget — Semáforo de Cambio de Aceite
// components/dashboard/OilChangeWidget.tsx
// ============================================================

import { AlertTriangle, CheckCircle2, Clock, Droplets, XCircle } from "lucide-react";
import type { OilChangeStatusData } from "@/lib/types";

interface OilChangeWidgetProps {
  data: OilChangeStatusData;
  kilometrajeActual: number;
}

const statusConfig = {
  green: {
    bg: "from-emerald-500/15 to-emerald-600/5",
    border: "border-emerald-500/40",
    ring: "ring-emerald-500/30",
    indicator: "bg-emerald-400",
    indicatorGlow: "shadow-emerald-500/60",
    text: "text-emerald-400",
    label: "¡Al día!",
    sublabel: "El vehículo no necesita servicio todavía.",
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/20",
    progressColor: "bg-emerald-400",
  },
  yellow: {
    bg: "from-amber-500/15 to-amber-600/5",
    border: "border-amber-500/40",
    ring: "ring-amber-500/30",
    indicator: "bg-amber-400",
    indicatorGlow: "shadow-amber-500/60",
    text: "text-amber-400",
    label: "Servicio próximo",
    sublabel: "Programa el cambio de aceite pronto.",
    icon: AlertTriangle,
    iconBg: "bg-amber-500/20",
    progressColor: "bg-amber-400",
  },
  red: {
    bg: "from-red-500/15 to-red-600/5",
    border: "border-red-500/40",
    ring: "ring-red-500/30",
    indicator: "bg-red-400",
    indicatorGlow: "shadow-red-500/60",
    text: "text-red-400",
    label: "¡Servicio vencido!",
    sublabel: "Se ha superado el límite de kilometraje.",
    icon: XCircle,
    iconBg: "bg-red-500/20",
    progressColor: "bg-red-400",
  },
};

function formatKm(km: number): string {
  return new Intl.NumberFormat("es-PE").format(km) + " km";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Calcula el porcentaje de uso del intervalo (0-100) para la barra de progreso */
function calcularPorcentajeUso(
  kmActual: number,
  kmServicio: number,
  proximoKm: number
): number {
  const total = proximoKm - kmServicio;
  if (total <= 0) return 100;
  const usado = kmActual - kmServicio;
  return Math.min(Math.max((usado / total) * 100, 0), 100);
}

export function OilChangeWidget({ data, kilometrajeActual }: OilChangeWidgetProps) {
  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  const porcentajeUso =
    data.ultimoServicio
      ? calcularPorcentajeUso(
          kilometrajeActual,
          data.ultimoServicio.kilometraje_servicio,
          data.proximoKilometraje
        )
      : 0;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6
        backdrop-blur-sm ring-1 transition-all duration-300
        ${config.bg} ${config.border} ${config.ring}
      `}
    >
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.iconBg}`}>
            <Droplets className={`h-5 w-5 ${config.text}`} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Semáforo de Aceite</h3>
            <p className="text-xs text-slate-400">Cambio de aceite preventivo</p>
          </div>
        </div>

        {/* Indicador de estado animado */}
        <div className="flex items-center gap-2">
          <div
            className={`
              relative flex h-10 w-10 items-center justify-center rounded-full
              ${config.indicatorGlow}
            `}
          >
            <StatusIcon className={`h-6 w-6 ${config.text}`} strokeWidth={1.5} />
            {/* Pulso animado para alerta */}
            {data.status !== "green" && (
              <span
                className={`absolute inset-0 animate-ping rounded-full opacity-30 ${config.indicator}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Estado principal */}
      <div className="relative mt-5">
        <div className={`text-lg font-bold ${config.text}`}>{config.label}</div>
        <p className="mt-0.5 text-sm text-slate-400">{config.sublabel}</p>
      </div>

      {/* Barra de progreso */}
      {data.ultimoServicio && (
        <div className="relative mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Último servicio</span>
            <span>Próximo servicio</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${config.progressColor}`}
              style={{ width: `${porcentajeUso}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
            <span>{formatKm(data.ultimoServicio.kilometraje_servicio)}</span>
            <span>{formatKm(data.proximoKilometraje)}</span>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="relative mt-5 grid grid-cols-3 gap-3">
        {/* KM Actuales */}
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-xs text-slate-500">KM Actual</p>
          <p className="mt-1 text-sm font-bold text-white">
            {new Intl.NumberFormat("es-PE").format(kilometrajeActual)}
          </p>
        </div>

        {/* KM Restantes */}
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-xs text-slate-500">KM Restantes</p>
          <p className={`mt-1 text-sm font-bold ${config.text}`}>
            {data.status === "red"
              ? `+${new Intl.NumberFormat("es-PE").format(Math.abs(data.kmRestantes))}`
              : new Intl.NumberFormat("es-PE").format(data.kmRestantes)}
          </p>
        </div>

        {/* Próximo KM */}
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-xs text-slate-500">Próximo en</p>
          <p className="mt-1 text-sm font-bold text-white">
            {data.proximoKilometraje > 0
              ? new Intl.NumberFormat("es-PE").format(data.proximoKilometraje)
              : "—"}
          </p>
        </div>
      </div>

      {/* Último mantenimiento */}
      {data.ultimoServicio && (
        <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.5} />
          <div className="min-w-0 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Último cambio: </span>
            {data.ultimoServicio.tipo_aceite} —{" "}
            {formatDate(data.ultimoServicio.fecha_servicio)}
          </div>
        </div>
      )}

      {/* Sin historial */}
      {!data.ultimoServicio && (
        <div className="relative mt-4 rounded-xl bg-white/5 px-4 py-3 text-center text-xs text-slate-500">
          Sin historial de cambios de aceite registrados.
        </div>
      )}
    </div>
  );
}
