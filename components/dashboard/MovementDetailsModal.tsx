"use client";

// ============================================================
// COMPONENTE: MovementDetailsModal
// components/dashboard/MovementDetailsModal.tsx
// Muestra el desglose detallado de movimientos al hacer clic
// en cualquier tarjeta de métricas financieras
// ============================================================

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  CalendarDays,
  Car,
  FileText,
  User,
  DollarSign,
  Banknote,
  Wrench,
  ShoppingCart,
  Hammer,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  Receipt,
  Wallet,
} from "lucide-react";
import type {
  FinancialSummary,
  Unidad,
} from "@/lib/types";

export type MetricType =
  | "ingresos_dolares"
  | "ingresos_bolivares"
  | "gastos_repuestos"
  | "gastos_bs_directo"
  | "mantenimiento_aceite"
  | "mano_obra"
  | "rentabilidad_dolares"
  | "rentabilidad_bolivares"
  | "saldos_pendientes"
  | "otros_ingresos_usd"
  | "otros_ingresos_bs"
  | "otros_egresos_usd"
  | "otros_egresos_bs";

interface MovementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: MetricType | null;
  summary: FinancialSummary;
  isGlobal: boolean;
  unidad?: Unidad;
  unidades?: Unidad[];
  movimientos: {
    ingresos?: any[];
    registrosMantenimiento?: any[];
    mantenimientos?: any[];
    otrosIngresos?: any[];
    otrosEgresos?: any[];
    comprasDolares?: any[];
  };
  resumenPorUnidad?: any[];
}

function formatUSD(amount: number): string {
  const isNeg = amount < 0;
  return (
    (isNeg ? "-$" : "$") +
    Math.abs(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatBs(amount: number): string {
  const isNeg = amount < 0;
  return (
    (isNeg ? "-Bs. " : "Bs. ") +
    Math.abs(amount || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const clean = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;
  try {
    return new Date(clean + "T00:00:00").toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return clean;
  }
}

interface MovementRow {
  id: string | number;
  fecha: string;
  unidadId?: number;
  concepto: string;
  detalle?: string;
  comprobante?: string;
  montoPrincipal: string;
  montoSecundario?: string;
  tag?: string;
}

export function MovementDetailsModal({
  isOpen,
  onClose,
  metricType,
  summary,
  isGlobal,
  unidad,
  unidades = [],
  movimientos,
  resumenPorUnidad = [],
}: MovementDetailsModalProps) {
  const [search, setSearch] = useState("");

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mapa de unidades para resolver nombres en vista global
  const unidadesMap = useMemo(() => {
    const map: Record<number, Unidad> = {};
    for (const u of unidades) {
      map[u.id] = u;
    }
    return map;
  }, [unidades]);

  function getUnitLabel(unidadId: number): string {
    const u = unidadesMap[unidadId];
    if (!u) return `Unidad #${unidadId}`;
    return u.numero_unidad
      ? u.numero_unidad.toLowerCase().includes("unidad")
        ? `${u.numero_unidad} (${u.placa})`
        : `Unidad ${u.numero_unidad} (${u.placa})`
      : u.placa;
  }

  // Configuración de cabecera según la métrica
  const meta = useMemo(() => {
    switch (metricType) {
      case "ingresos_dolares":
        return {
          title: "Movimientos: Ingresos en Dólares",
          subtitle: "Detalle de fletes, pasajes y recaudación en divisas ($)",
          icon: DollarSign,
          color: "emerald",
          badgeText: "Dólares ($)",
          totalDisplay: formatUSD(summary.totalIngresosDolares),
        };
      case "ingresos_bolivares":
        return {
          title: "Movimientos: Ingresos en Bolívares",
          subtitle: "Detalle de pagos recibidos en moneda nacional (Bs)",
          icon: Banknote,
          color: "cyan",
          badgeText: "Bolívares (Bs)",
          totalDisplay: formatBs(summary.totalIngresosBolivares),
        };
      case "gastos_repuestos":
        return {
          title: "Movimientos: Gastos en Repuestos",
          subtitle: "Detalle de piezas, repuestos y compras acumuladas",
          icon: ShoppingCart,
          color: "red",
          badgeText: "Repuestos ($)",
          totalDisplay: formatUSD(summary.totalGastosRepuestos),
        };
      case "gastos_bs_directo":
        return {
          title: "Movimientos: Gastos en Bs Directos",
          subtitle: "Precios directos en Bolívares sin conversión a divisas",
          icon: Banknote,
          color: "purple",
          badgeText: "Gastos Bs",
          totalDisplay: formatBs(summary.totalGastosBsDirecto ?? 0),
        };
      case "mantenimiento_aceite":
        return {
          title: "Movimientos: Mantenimiento y Aceite",
          subtitle: "Historial de cambios de aceite y servicios preventivos",
          icon: Wrench,
          color: "amber",
          badgeText: "Servicios Aceite",
          totalDisplay: formatUSD(summary.totalMantenimientoAceite),
        };
      case "mano_obra":
        return {
          title: "Movimientos: Gastos en Mano de Obra",
          subtitle: "Servicios mecánicos, técnicos y trabajos adicionales",
          icon: Hammer,
          color: "orange",
          badgeText: "Mano de Obra ($)",
          totalDisplay: formatUSD(summary.totalManoObra),
        };
      case "rentabilidad_dolares":
        return {
          title: "Rentabilidad Neta en Dólares ($)",
          subtitle: "Cálculo consolidado: Ingresos ($) − Gastos ($) + Extras",
          icon: TrendingUp,
          color: "violet",
          badgeText: "Rentabilidad USD",
          totalDisplay: formatUSD(summary.rentabilidadDolares),
        };
      case "rentabilidad_bolivares":
        return {
          title: "Rentabilidad en Bolívares (Bs)",
          subtitle: "Cálculo consolidado: Ingresos Bs − Gastos Bs",
          icon: TrendingUp,
          color: "cyan",
          badgeText: "Rentabilidad Bs",
          totalDisplay: formatBs(summary.rentabilidadBsDirecta ?? summary.rentabilidadBolivares),
        };
      case "saldos_pendientes":
        return {
          title: "Saldos Pendientes por Pagar",
          subtitle: "Mantenimientos y repuestos con abono registrado y deuda pendiente",
          icon: AlertCircle,
          color: "rose",
          badgeText: "Por Pagar ($)",
          totalDisplay: formatUSD(summary.totalSaldoPendiente ?? 0),
        };
      case "otros_ingresos_usd":
        return {
          title: "Otros Ingresos en Dólares ($)",
          subtitle: "Ingresos adicionales registrados en divisa",
          icon: Wallet,
          color: "emerald",
          badgeText: "Extra USD",
          totalDisplay: formatUSD(summary.totalOtrosIngresosDolares ?? 0),
        };
      case "otros_ingresos_bs":
        return {
          title: "Otros Ingresos en Bolívares (Bs)",
          subtitle: "Ingresos adicionales registrados en moneda nacional",
          icon: Wallet,
          color: "cyan",
          badgeText: "Extra Bs",
          totalDisplay: formatBs(summary.totalOtrosIngresosBolivares ?? 0),
        };
      case "otros_egresos_usd":
        return {
          title: "Otros Egresos en Dólares ($)",
          subtitle: "Gastos y egresos adicionales en divisa",
          icon: TrendingDown,
          color: "rose",
          badgeText: "Egreso USD",
          totalDisplay: formatUSD(summary.totalOtrosEgresosDolares ?? 0),
        };
      case "otros_egresos_bs":
        return {
          title: "Otros Egresos en Bolívares (Bs)",
          subtitle: "Gastos y egresos adicionales en moneda nacional",
          icon: TrendingDown,
          color: "rose",
          badgeText: "Egreso Bs",
          totalDisplay: formatBs(summary.totalOtrosEgresosBolivares ?? 0),
        };
      default:
        return {
          title: "Detalle de Movimientos",
          subtitle: "Movimientos registrados",
          icon: Layers,
          color: "violet",
          badgeText: "Detalle",
          totalDisplay: "$0.00",
        };
    }
  }, [metricType, summary]);

  // Filtrado de filas según la métrica activa
  const rows: MovementRow[] = useMemo(() => {
    if (!metricType) return [];
    const term = search.trim().toLowerCase();

    function matchSearch(...texts: (string | number | undefined | null)[]) {
      if (!term) return true;
      return texts.some((t) => t !== undefined && t !== null && String(t).toLowerCase().includes(term));
    }

    switch (metricType) {
      case "ingresos_dolares": {
        const list = movimientos.ingresos ?? [];
        return list
          .filter((i) => (Number(i.dolares) || 0) > 0)
          .filter((i) =>
            matchSearch(
              i.fecha,
              i.concepto,
              i.nombre_operador,
              i.comprobante,
              i.tipo,
              isGlobal ? getUnitLabel(i.unidad_id) : undefined
            )
          )
          .map((i) => ({
            id: i.id,
            fecha: i.fecha,
            unidadId: i.unidad_id,
            concepto: i.concepto || "Ingreso diario",
            detalle: i.nombre_operador ? `Operador: ${i.nombre_operador}` : i.tipo || "Ruta",
            comprobante: i.comprobante,
            montoPrincipal: formatUSD(Number(i.dolares) || 0),
            montoSecundario: i.monto_bs_dolar
              ? `Bs ${(Number(i.dolares) * Number(i.monto_bs_dolar)).toLocaleString("es-VE", { minimumFractionDigits: 2 })} (@ ${i.monto_bs_dolar}/$)`
              : undefined,
            tag: i.tipo,
          }));
      }

      case "ingresos_bolivares": {
        const list = movimientos.ingresos ?? [];
        return list
          .filter((i) => (Number(i.monto_ingreso) || 0) > 0)
          .filter((i) =>
            matchSearch(
              i.fecha,
              i.concepto,
              i.nombre_operador,
              i.comprobante,
              i.tipo,
              isGlobal ? getUnitLabel(i.unidad_id) : undefined
            )
          )
          .map((i) => {
            const desgloses: string[] = [];
            if (i.pago_movil) desgloses.push(`PM: ${formatBs(i.pago_movil)}`);
            if (i.movi) desgloses.push(`Movi: ${formatBs(i.movi)}`);
            if (i.efectivo) desgloses.push(`Efec: ${formatBs(i.efectivo)}`);
            if (i.dolares) desgloses.push(`$${i.dolares}`);
            return {
              id: i.id,
              fecha: i.fecha,
              unidadId: i.unidad_id,
              concepto: i.concepto || "Ingreso diario",
              detalle: desgloses.length > 0 ? desgloses.join(" · ") : (i.nombre_operador ? `Operador: ${i.nombre_operador}` : "Recaudación"),
              comprobante: i.comprobante,
              montoPrincipal: formatBs(Number(i.monto_ingreso) || 0),
              tag: i.tipo,
            };
          });
      }

      case "gastos_repuestos": {
        const list = movimientos.registrosMantenimiento ?? [];
        return list
          .filter((r) => (Number(r.rep_subtotal) || 0) > 0 || (Number(r.precio_bs_repuestos) || 0) > 0)
          .filter((r) =>
            matchSearch(
              r.fecha,
              r.rep_concepto,
              r.proveedor,
              r.notas,
              isGlobal ? getUnitLabel(r.unidad_id) : undefined
            )
          )
          .map((r) => ({
            id: r.id,
            fecha: r.fecha,
            unidadId: r.unidad_id,
            concepto: r.rep_concepto || "Repuesto / Pieza",
            detalle: r.rep_cantidad
              ? `${r.rep_cantidad} un. ${r.rep_costo_unitario ? `x ${formatUSD(r.rep_costo_unitario)}` : ""} ${r.proveedor ? `· Prov: ${r.proveedor}` : ""}`
              : r.proveedor || r.notas || "Mantenimiento",
            montoPrincipal: formatUSD(Number(r.rep_subtotal) || 0),
            montoSecundario: (Number(r.precio_bs_repuestos) || 0) > 0 ? `Bs. ${Number(r.precio_bs_repuestos).toLocaleString("es-VE", { minimumFractionDigits: 2 })} directos` : undefined,
          }));
      }

      case "gastos_bs_directo": {
        const list = movimientos.registrosMantenimiento ?? [];
        return list
          .filter(
            (r) =>
              (Number(r.precio_bs_repuestos) || 0) > 0 ||
              (Number(r.precio_bs_mano_obra) || 0) > 0
          )
          .filter((r) =>
            matchSearch(
              r.fecha,
              r.rep_concepto,
              r.mo_concepto,
              r.notas,
              isGlobal ? getUnitLabel(r.unidad_id) : undefined
            )
          )
          .map((r) => {
            const tot = (Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0);
            return {
              id: r.id,
              fecha: r.fecha,
              unidadId: r.unidad_id,
              concepto: r.rep_concepto || r.mo_concepto || "Gasto en Bs Directo",
              detalle: `Rep: ${formatBs(r.precio_bs_repuestos || 0)} · MO: ${formatBs(r.precio_bs_mano_obra || 0)}`,
              montoPrincipal: formatBs(tot),
            };
          });
      }

      case "mantenimiento_aceite": {
        const list = movimientos.mantenimientos ?? [];
        return list
          .filter((m) =>
            matchSearch(
              m.fecha_servicio,
              m.tipo_aceite,
              m.notas,
              isGlobal ? getUnitLabel(m.unidad_id) : undefined
            )
          )
          .map((m) => ({
            id: m.id,
            fecha: m.fecha_servicio,
            unidadId: m.unidad_id,
            concepto: m.tipo_aceite ? `Cambio de Aceite: ${m.tipo_aceite}` : "Cambio de Aceite",
            detalle: `Km servicio: ${Number(m.kilometraje_servicio || 0).toLocaleString()} km ${m.proximo_kilometraje ? `· Próximo: ${Number(m.proximo_kilometraje).toLocaleString()} km` : ""}`,
            montoPrincipal: formatUSD(Number(m.costo_servicio) || 0),
          }));
      }

      case "mano_obra": {
        const list = movimientos.registrosMantenimiento ?? [];
        return list
          .filter((r) => (Number(r.mo_costo) || 0) > 0 || (Number(r.precio_bs_mano_obra) || 0) > 0)
          .filter((r) =>
            matchSearch(
              r.fecha,
              r.mo_concepto,
              r.proveedor,
              r.notas,
              isGlobal ? getUnitLabel(r.unidad_id) : undefined
            )
          )
          .map((r) => ({
            id: r.id,
            fecha: r.fecha,
            unidadId: r.unidad_id,
            concepto: r.mo_concepto || "Mano de obra / Taller",
            detalle: r.proveedor ? `Mecánico / Taller: ${r.proveedor}` : r.notas || "Servicio técnico",
            montoPrincipal: formatUSD(Number(r.mo_costo) || 0),
            montoSecundario: (Number(r.precio_bs_mano_obra) || 0) > 0 ? `Bs. ${Number(r.precio_bs_mano_obra).toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : undefined,
          }));
      }

      case "saldos_pendientes": {
        const list = movimientos.registrosMantenimiento ?? [];
        return list
          .filter((r) => {
            const abono = Number(r.abono) || 0;
            const costo = Number(r.costo_total) || 0;
            return abono > 0 && costo > abono;
          })
          .filter((r) =>
            matchSearch(
              r.fecha,
              r.rep_concepto,
              r.mo_concepto,
              r.proveedor,
              isGlobal ? getUnitLabel(r.unidad_id) : undefined
            )
          )
          .map((r) => {
            const costo = Number(r.costo_total) || 0;
            const abono = Number(r.abono) || 0;
            const pendiente = costo - abono;
            return {
              id: r.id,
              fecha: r.fecha,
              unidadId: r.unidad_id,
              concepto: r.rep_concepto || r.mo_concepto || "Servicio con abono registrado",
              detalle: `Costo total: ${formatUSD(costo)} · Abono pagado: ${formatUSD(abono)}`,
              montoPrincipal: formatUSD(pendiente),
              tag: "Debe",
            };
          });
      }

      case "otros_ingresos_usd":
      case "otros_ingresos_bs": {
        const moneda = metricType === "otros_ingresos_usd" ? "USD" : "BS";
        const list = (movimientos.otrosIngresos ?? []).filter((o) => o.tipo_moneda === moneda);
        return list
          .filter((o) => matchSearch(o.fecha, o.concepto, o.notas))
          .map((o) => ({
            id: o.id,
            fecha: o.fecha,
            concepto: o.concepto,
            detalle: o.notas || "Ingreso adicional registrado",
            montoPrincipal: moneda === "USD" ? formatUSD(o.monto_usd) : formatBs(o.monto_bs),
          }));
      }

      case "otros_egresos_usd":
      case "otros_egresos_bs": {
        const moneda = metricType === "otros_egresos_usd" ? "USD" : "BS";
        const list = (movimientos.otrosEgresos ?? []).filter((o) => o.tipo_moneda === moneda);
        return list
          .filter((o) => matchSearch(o.fecha, o.concepto, o.notas))
          .map((o) => ({
            id: o.id,
            fecha: o.fecha,
            concepto: o.concepto,
            detalle: o.notas || "Gasto adicional registrado",
            montoPrincipal: moneda === "USD" ? formatUSD(o.monto_usd) : formatBs(o.monto_bs),
          }));
      }

      default:
        return [];
    }
  }, [metricType, movimientos, search, isGlobal, unidadesMap]);

  if (!isOpen || !metricType) return null;

  const Icon = meta.icon;

  const colorStyles: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/30" },
    cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", ring: "ring-cyan-500/30" },
    red: { bg: "bg-red-500/20", text: "text-red-400", ring: "ring-red-500/30" },
    purple: { bg: "bg-purple-500/20", text: "text-purple-400", ring: "ring-purple-500/30" },
    amber: { bg: "bg-amber-500/20", text: "text-amber-400", ring: "ring-amber-500/30" },
    orange: { bg: "bg-orange-500/20", text: "text-orange-400", ring: "ring-orange-500/30" },
    violet: { bg: "bg-violet-500/20", text: "text-violet-400", ring: "ring-violet-500/30" },
    rose: { bg: "bg-rose-500/20", text: "text-rose-400", ring: "ring-rose-500/30" },
  };

  const style = colorStyles[meta.color] || colorStyles.violet;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal Card */}
      <div
        className="relative z-10 flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl border border-white/10 bg-[#0c0d16] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decorativo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-4 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.bg} ring-1 ${style.ring}`}>
              <Icon className={`h-5 w-5 ${style.text}`} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {meta.title}
                </h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border border-white/10 ${style.bg} ${style.text}`}>
                  {meta.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isGlobal
                  ? `Flota completa (${unidades.length} vehículos registrados)`
                  : unidad
                  ? `${unidad.numero_unidad ? (unidad.numero_unidad.toLowerCase().includes("unidad") ? unidad.numero_unidad : `Unidad ${unidad.numero_unidad}`) : unidad.placa} · ${unidad.marca} ${unidad.modelo}`
                  : "Detalle de movimientos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total Acumulado</p>
              <p className={`font-mono text-lg font-bold ${style.text}`}>
                {meta.totalDisplay}
              </p>
            </div>
            <button
              onClick={onClose}
              title="Cerrar modal"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda & total móvil */}
        <div className="px-5 sm:px-6 py-3 border-b border-white/10 bg-black/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por concepto, operador, fecha o unidad..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 shrink-0">
            <span className="font-mono text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              {rows.length} {rows.length === 1 ? "movimiento" : "movimientos"}
            </span>
            <span className="sm:hidden font-mono font-bold text-sm text-emerald-300">
              {meta.totalDisplay}
            </span>
          </div>
        </div>

        {/* Casos especiales: Rentabilidad Neta / Rentabilidad Bs */}
        {metricType === "rentabilidad_dolares" || metricType === "rentabilidad_bolivares" ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Tarjeta de Fórmula */}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 sm:p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-3">
                Desglose Matemático de la Rentabilidad
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {metricType === "rentabilidad_dolares" ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-white/5 text-emerald-300">
                      <span>(+) Ingresos en Dólares ($)</span>
                      <span className="font-mono font-bold">{formatUSD(summary.totalIngresosDolares)}</span>
                    </div>
                    {(summary.totalOtrosIngresosDolares ?? 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5 text-emerald-300">
                        <span>(+) Otros Ingresos en Dólares</span>
                        <span className="font-mono font-bold">{formatUSD(summary.totalOtrosIngresosDolares ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-white/5 text-red-300">
                      <span>(−) Gastos en Repuestos</span>
                      <span className="font-mono font-bold">−{formatUSD(summary.totalGastosRepuestos)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5 text-orange-300">
                      <span>(−) Mano de Obra</span>
                      <span className="font-mono font-bold">−{formatUSD(summary.totalManoObra)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5 text-amber-300">
                      <span>(−) Mantenimiento Aceite</span>
                      <span className="font-mono font-bold">−{formatUSD(summary.totalMantenimientoAceite)}</span>
                    </div>
                    {(summary.totalOtrosEgresosDolares ?? 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5 text-rose-300">
                        <span>(−) Otros Egresos en Dólares</span>
                        <span className="font-mono font-bold">−{formatUSD(summary.totalOtrosEgresosDolares ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-sm sm:text-base font-bold text-white border-t border-white/10">
                      <span>(=) Rentabilidad Neta Final:</span>
                      <span className={`font-mono ${summary.rentabilidadDolares >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                        {formatUSD(summary.rentabilidadDolares)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-1 border-b border-white/5 text-cyan-300">
                      <span>(+) Ingresos en Bolívares (Disponibles)</span>
                      <span className="font-mono font-bold">{formatBs(summary.totalIngresosBolivares)}</span>
                    </div>
                    {(summary.totalOtrosIngresosBolivares ?? 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5 text-cyan-300">
                        <span>(+) Otros Ingresos en Bolívares</span>
                        <span className="font-mono font-bold">{formatBs(summary.totalOtrosIngresosBolivares ?? 0)}</span>
                      </div>
                    )}
                    {(summary.totalGastosBsDirecto ?? 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5 text-purple-300">
                        <span>(−) Gastos Directos en Bolívares</span>
                        <span className="font-mono font-bold">−{formatBs(summary.totalGastosBsDirecto ?? 0)}</span>
                      </div>
                    )}
                    {(summary.totalOtrosEgresosBolivares ?? 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5 text-rose-300">
                        <span>(−) Otros Egresos en Bolívares</span>
                        <span className="font-mono font-bold">−{formatBs(summary.totalOtrosEgresosBolivares ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-sm sm:text-base font-bold text-white border-t border-white/10">
                      <span>(=) Rentabilidad en Bs:</span>
                      <span className={`font-mono ${(summary.rentabilidadBsDirecta ?? 0) >= 0 ? "text-cyan-300" : "text-red-300"}`}>
                        {formatBs(summary.rentabilidadBsDirecta ?? summary.rentabilidadBolivares)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Si es Resumen General, mostrar desglose por cada unidad */}
            {isGlobal && resumenPorUnidad.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rentabilidad por Unidad (Flota)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-xs">
                    <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="px-3 py-2 text-left">Unidad</th>
                        <th className="px-3 py-2 text-right">Ingresos $</th>
                        <th className="px-3 py-2 text-right">Gastos $</th>
                        <th className="px-3 py-2 text-right">Rentab. $</th>
                        <th className="px-3 py-2 text-right">Rentab. Bs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {resumenPorUnidad.map((u) => {
                        const totGastos =
                          (u.totalGastosRepuestos ?? 0) +
                          (u.totalMantenimientoAceite ?? 0) +
                          (u.totalManoObra ?? 0);
                        return (
                          <tr key={u.unidad_id} className="hover:bg-white/5">
                            <td className="px-3 py-2 font-medium text-white">
                              {u.numero_unidad
                                ? (u.numero_unidad.toLowerCase().includes("unidad") ? u.numero_unidad : `Unidad ${u.numero_unidad}`)
                                : u.placa}{" "}
                              <span className="text-[10px] text-slate-500">({u.placa})</span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-300 font-semibold">
                              {formatUSD(u.totalIngresosDolares ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-red-300">
                              {formatUSD(totGastos)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono font-bold ${
                                (u.rentabilidadDolares ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                              }`}
                            >
                              {formatUSD(u.rentabilidadDolares ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-cyan-300">
                              {formatBs(u.rentabilidadBsDirecta ?? u.rentabilidadBolivares ?? 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Lista de movimientos estándar */
          <div className="flex-1 overflow-y-auto">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <FileText className="h-10 w-10 text-slate-600 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-slate-400">Sin movimientos que mostrar</p>
                <p className="text-xs text-slate-600 mt-1">
                  {search ? "No se encontraron coincidencias con la búsqueda" : "No hay registros cargados para esta categoría en este período"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 sm:px-6 py-3.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm tracking-tight truncate">
                          {row.concepto}
                        </p>
                        {row.tag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/15 text-violet-300">
                            {row.tag}
                          </span>
                        )}
                        {isGlobal && row.unidadId && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                            <Car className="h-3 w-3 text-slate-500" />
                            {getUnitLabel(row.unidadId)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                          {formatDate(row.fecha)}
                        </span>
                        {row.detalle && (
                          <span className="text-slate-400 truncate max-w-md">
                            {row.detalle}
                          </span>
                        )}
                        {row.comprobante && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            Comp: {row.comprobante}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      <p className={`font-mono text-base font-bold ${style.text}`}>
                        {row.montoPrincipal}
                      </p>
                      {row.montoSecundario && (
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {row.montoSecundario}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 px-5 sm:px-6 py-3.5 bg-white/[0.02] flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 hidden sm:block">
            Haz clic fuera o presiona <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 border border-white/10">Esc</kbd> para cerrar
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
