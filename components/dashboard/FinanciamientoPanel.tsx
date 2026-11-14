"use client";

// ============================================================
// COMPONENTE: FinanciamientoPanel
// components/dashboard/FinanciamientoPanel.tsx
// Panel para gestionar Piezas/Repuestos y Otros Egresos financiados,
// registrar pagos y llevar el control de abonos.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Package,
  MinusCircle,
  CalendarDays,
  DollarSign,
  Banknote,
  Car,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  X,
  History,
  Clock,
  Filter,
} from "lucide-react";
import {
  registrarPagoFinanciamientoAction,
  eliminarPagoFinanciamientoAction,
} from "@/app/actions/financiamiento";
import type {
  OtroEgreso,
  RegistroMantenimiento,
  PagoFinanciamiento,
  Unidad,
} from "@/lib/types";

interface FinanciamientoPanelProps {
  otrosEgresos: OtroEgreso[];
  mantenimientos: RegistroMantenimiento[];
  pagos: PagoFinanciamiento[];
  unidades: Unidad[];
  activeUnidadId?: number;
}

type FinanciadoItem = {
  key: string;
  tipo: "mantenimiento" | "otro_egreso";
  id: number;
  unidadId: number;
  fecha: string;
  concepto: string;
  montoOriginalUSD?: number;
  montoOriginalBs?: number;
  notas?: string | null;
  proveedor?: string | null;
};

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatBs(amount: number): string {
  return (
    "Bs. " +
    (amount || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function FinanciamientoPanel({
  otrosEgresos,
  mantenimientos,
  pagos,
  unidades,
  activeUnidadId,
}: FinanciamientoPanelProps) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<"todos" | "mantenimiento" | "otro_egreso">("todos");
  const [unitFilter, setUnitFilter] = useState<number | "todas">("todas");
  const [modalItem, setModalItem] = useState<FinanciadoItem | null>(null);

  // Formulario de pago
  const [pagoMoneda, setPagoMoneda] = useState<"USD" | "BS">("USD");
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split("T")[0]);
  const [pagoNotas, setPagoNotas] = useState("");
  const [pagoCompleto, setPagoCompleto] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingPagoId, setDeletingPagoId] = useState<number | null>(null);

  const unidadesMap = new Map<number, Unidad>(unidades.map((u) => [u.id, u]));

  function getUnitLabel(uid?: number) {
    if (!uid) return "Sin unidad";
    const u = unidadesMap.get(uid);
    if (!u) return `Unidad #${uid}`;
    return u.numero_unidad
      ? (u.numero_unidad.toLowerCase().includes("unidad") ? u.numero_unidad : `Unidad ${u.numero_unidad}`)
      : u.placa;
  }

  // Unificar lista de financiados
  const items: FinanciadoItem[] = [
    ...mantenimientos.map((m) => ({
      key: `man-${m.id}`,
      tipo: "mantenimiento" as const,
      id: m.id,
      unidadId: m.unidad_id,
      fecha: m.fecha,
      concepto: m.rep_concepto || m.mo_concepto || "Mantenimiento General",
      montoOriginalUSD: m.costo_total,
      montoOriginalBs: (m.precio_bs_repuestos || 0) + (m.precio_bs_mano_obra || 0),
      notas: m.notas,
      proveedor: m.proveedor,
    })),
    ...otrosEgresos.map((oe) => ({
      key: `oe-${oe.id}`,
      tipo: "otro_egreso" as const,
      id: oe.id,
      unidadId: oe.unidad_id ?? 0,
      fecha: oe.fecha,
      concepto: oe.concepto,
      montoOriginalUSD: oe.tipo_moneda === "USD" ? oe.monto_usd : 0,
      montoOriginalBs: oe.tipo_moneda === "BS" ? oe.monto_bs : 0,
      notas: oe.notas,
    })),
  ].sort((a, b) => (b.fecha > a.fecha ? 1 : -1));

  // Filtrado
  const filteredItems = items.filter((it) => {
    if (selectedFilter !== "todos" && it.tipo !== selectedFilter) return false;
    if (unitFilter !== "todas" && it.unidadId !== unitFilter) return false;
    return true;
  });

  // Pagos indexados por item
  function getPagosForItem(item: FinanciadoItem) {
    return pagos.filter((p) =>
      item.tipo === "mantenimiento"
        ? p.registro_mantenimiento_id === item.id
        : p.otro_egreso_id === item.id
    );
  }

  // Totales de pagos para un item
  function getTotalesForItem(item: FinanciadoItem) {
    const itemPagos = getPagosForItem(item);
    const usd = itemPagos.filter((p) => p.tipo_moneda === "USD").reduce((s, p) => s + Number(p.monto_usd), 0);
    const bs = itemPagos.filter((p) => p.tipo_moneda === "BS").reduce((s, p) => s + Number(p.monto_bs), 0);
    return { usd, bs, count: itemPagos.length };
  }

  // Totales globales
  const totalPagadoUSD = pagos
    .filter((p) => p.tipo_moneda === "USD")
    .reduce((s, p) => s + Number(p.monto_usd), 0);
  const totalPagadoBs = pagos
    .filter((p) => p.tipo_moneda === "BS")
    .reduce((s, p) => s + Number(p.monto_bs), 0);

  const totalPiezasCount = mantenimientos.length;
  const totalOtrosCount = otrosEgresos.length;

  const handleOpenModal = (item: FinanciadoItem) => {
    setModalItem(item);
    setPagoMonto("");
    setPagoNotas("");
    setPagoCompleto(false);
    setPagoError(null);
  };

  const handleRegistrarPago = () => {
    if (!modalItem) return;
    const monto = parseFloat(pagoMonto);
    if (isNaN(monto) || monto <= 0) {
      setPagoError("Ingresa un monto válido mayor a 0.");
      return;
    }
    if (!pagoFecha) {
      setPagoError("La fecha es obligatoria.");
      return;
    }

    setPagoError(null);
    startTransition(async () => {
      const fd = new FormData();
      if (modalItem.tipo === "mantenimiento") {
        fd.set("registro_mantenimiento_id", String(modalItem.id));
      } else {
        fd.set("otro_egreso_id", String(modalItem.id));
      }
      fd.set("tipo_moneda", pagoMoneda);
      if (pagoMoneda === "USD") {
        fd.set("monto_usd", String(monto));
        fd.set("monto_bs", "0");
      } else {
        fd.set("monto_bs", String(monto));
        fd.set("monto_usd", "0");
      }
      fd.set("fecha", pagoFecha);
      if (pagoNotas) fd.set("notas", pagoNotas);
      if (pagoCompleto) fd.set("pago_completo", "true");

      const res = await registrarPagoFinanciamientoAction({ success: false }, fd);
      if (!res.success) {
        setPagoError(res.error || "Error al registrar el pago.");
      } else {
        setPagoMonto("");
        setPagoNotas("");
        if (pagoCompleto) {
          setModalItem(null);
        }
        router.refresh();
      }
    });
  };

  const handleDeletePago = (pagoId: number) => {
    if (!confirm("¿Eliminar este pago registrado?")) return;
    setDeletingPagoId(pagoId);
    startTransition(async () => {
      await eliminarPagoFinanciamientoAction(pagoId);
      setDeletingPagoId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-500/40">
            <CreditCard className="h-6 w-6 text-blue-400" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Financiamiento
              <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold text-blue-300 font-mono">
                {items.length} pendientes
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Control de Piezas/Repuestos y Otros Egresos financiados a crédito
            </p>
          </div>
        </div>

        {/* Filtro por unidad */}
        {unidades.length > 0 && (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-slate-500" />
            <select
              value={unitFilter}
              onChange={(e) =>
                setUnitFilter(e.target.value === "todas" ? "todas" : Number(e.target.value))
              }
              className="rounded-xl border border-white/10 bg-[#0f1117] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
            >
              <option value="todas">Todas las unidades</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.numero_unidad
                    ? (u.numero_unidad.toLowerCase().includes("unidad") ? u.numero_unidad : `Unidad ${u.numero_unidad}`)
                    : u.placa} — {u.marca} {u.modelo}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 shrink-0">
            <Package className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-semibold">
              Repuestos Financiados
            </p>
            <p className="text-lg font-bold font-mono text-amber-300">
              {totalPiezasCount} {totalPiezasCount === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 shrink-0">
            <MinusCircle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-rose-400/80 font-semibold">
              Otros Egresos Financiados
            </p>
            <p className="text-lg font-bold font-mono text-rose-300">
              {totalOtrosCount} {totalOtrosCount === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 shrink-0">
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-emerald-400/80 font-semibold">
              Total Pagos en Dólares
            </p>
            <p className="text-lg font-bold font-mono text-emerald-300">
              {formatUSD(totalPagadoUSD)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 shrink-0">
            <Banknote className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-cyan-400/80 font-semibold">
              Total Pagos en Bolívares
            </p>
            <p className="text-lg font-bold font-mono text-cyan-300">
              {formatBs(totalPagadoBs)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Filtro tipo y Selector de Unidad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFilter("todos")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "todos"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Todos ({items.length})
          </button>
          <button
            onClick={() => setSelectedFilter("mantenimiento")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "mantenimiento"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Piezas y Repuestos ({totalPiezasCount})
          </button>
          <button
            onClick={() => setSelectedFilter("otro_egreso")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedFilter === "otro_egreso"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MinusCircle className="h-3.5 w-3.5" />
            Otros Egresos ({totalOtrosCount})
          </button>
        </div>

        {/* Filtro por unidad */}
        <div className="flex items-center gap-2">
          <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={unitFilter}
            onChange={(e) =>
              setUnitFilter(e.target.value === "todas" ? "todas" : Number(e.target.value))
            }
            className="rounded-xl border border-white/10 bg-[#141424] px-3 py-1.5 text-xs text-white outline-none transition-all hover:border-white/20 focus:border-blue-500/60 cursor-pointer"
          >
            <option value="todas">Todas las unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.numero_unidad
                  ? u.numero_unidad.toLowerCase().includes("unidad")
                    ? u.numero_unidad
                    : `Unidad ${u.numero_unidad}`
                  : u.placa}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de items financiados */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20 mb-3">
            <CreditCard className="h-6 w-6 text-blue-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-white">No hay registros financiados</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Cuando marques la opción "Financiado" al registrar un egreso o mantenimiento, aparecerá aquí para gestionar sus pagos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const totales = getTotalesForItem(item);
            const itemPagos = getPagosForItem(item);
            const isMan = item.tipo === "mantenimiento";

            return (
              <div
                key={item.key}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 space-y-4 hover:border-white/20 transition-all backdrop-blur-sm"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                        isMan
                          ? "bg-amber-500/20 ring-1 ring-amber-500/30"
                          : "bg-rose-500/20 ring-1 ring-rose-500/30"
                      }`}
                    >
                      {isMan ? (
                        <Package className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
                      ) : (
                        <MinusCircle className="h-5 w-5 text-rose-400" strokeWidth={1.75} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isMan
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                          }`}
                        >
                          {isMan ? "Piezas / Repuestos" : "Otro Egreso"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                          <Clock className="h-2.5 w-2.5" />
                          Financiado
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 leading-snug line-clamp-1" title={item.concepto}>
                        {item.concepto}
                      </h3>
                    </div>
                  </div>

                  {/* Botón Pagar */}
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all shrink-0 active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Pagar
                  </button>
                </div>

                {/* Info Unidad y Fecha */}
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatDate(item.fecha)}</span>
                  </div>
                  {item.unidadId > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-slate-300 font-medium">{getUnitLabel(item.unidadId)}</span>
                    </div>
                  )}
                  {item.proveedor && (
                    <span className="text-slate-500">· Prov: {item.proveedor}</span>
                  )}
                </div>

                {/* Resumen de pagos registrados */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      Pagos registrados ({totales.count}):
                    </span>
                    <div className="text-right space-y-0.5">
                      {totales.usd > 0 && (
                        <p className="font-mono font-bold text-emerald-300 text-xs">
                          {formatUSD(totales.usd)}
                        </p>
                      )}
                      {totales.bs > 0 && (
                        <p className="font-mono font-bold text-cyan-300 text-xs">
                          {formatBs(totales.bs)}
                        </p>
                      )}
                      {totales.usd === 0 && totales.bs === 0 && (
                        <span className="text-slate-500 italic text-[11px]">Sin abonos aún</span>
                      )}
                    </div>
                  </div>

                  {/* Últimos pagos pequeños */}
                  {itemPagos.length > 0 && (
                    <div className="border-t border-white/5 pt-2 space-y-1">
                      {itemPagos.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-[11px] text-slate-400"
                        >
                          <span>
                            {formatDate(p.fecha)} {p.notas ? `· ${p.notas}` : ""}
                          </span>
                          <span className="font-mono font-semibold text-white">
                            {p.tipo_moneda === "USD" ? formatUSD(p.monto_usd) : formatBs(p.monto_bs)}
                          </span>
                        </div>
                      ))}
                      {itemPagos.length > 3 && (
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Ver todos los {itemPagos.length} pagos...
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal de Pago ── */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModalItem(null)}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e1a] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-500/30">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Pago</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[280px]">
                    {modalItem.concepto} · {getUnitLabel(modalItem.unidadId)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="px-6 py-5 space-y-4 max-h-[calc(85vh-100px)] overflow-y-auto">
              {pagoError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {pagoError}
                </div>
              )}

              {/* Formulario de Registro de Pago */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Nuevo Abono / Pago
                </p>

                {/* Moneda */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPagoMoneda("USD")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                      pagoMoneda === "USD"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Dólares (USD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagoMoneda("BS")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                      pagoMoneda === "BS"
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" /> Bolívares (Bs)
                  </button>
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">
                      Monto a Pagar <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      {pagoMoneda === "USD" ? (
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-400" />
                      )}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={pagoMonto}
                        onChange={(e) => setPagoMonto(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">
                      Fecha <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="date"
                        value={pagoFecha}
                        onChange={(e) => setPagoFecha(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white focus:border-blue-500/60 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Detalle / Notas <span className="text-slate-600">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Abono 1 de 3, Transferencia, Efectivo..."
                    value={pagoNotas}
                    onChange={(e) => setPagoNotas(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500/60 focus:outline-none"
                  />
                </div>

                {/* Opción Pago Completo */}
                <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 hover:bg-emerald-500/15 transition-all">
                  <input
                    type="checkbox"
                    checked={pagoCompleto}
                    onChange={(e) => setPagoCompleto(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-500/50 bg-black/40 text-emerald-500 focus:ring-emerald-500/40 cursor-pointer accent-emerald-500"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pago completo (Finalizar financiamiento)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Marca esta opción una vez completado el pago total para cancelar el financiamiento.
                    </p>
                  </div>
                </label>

                {/* Botón Guardar Pago */}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleRegistrarPago}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                    pagoCompleto
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                      : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                  }`}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />{" "}
                      {pagoCompleto
                        ? "Registrar Pago y Finalizar Financiamiento"
                        : "Registrar Pago"}
                    </>
                  )}
                </button>
              </div>

              {/* Historial de Pagos de este ítem */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> Historial de Pagos Registrados
                </p>

                {getPagosForItem(modalItem).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 italic">
                    Aún no se han registrado abonos o pagos para este ítem.
                  </p>
                ) : (
                  <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    {getPagosForItem(modalItem).map((pago) => (
                      <div
                        key={pago.id}
                        className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="font-mono text-sm font-bold text-white">
                            {pago.tipo_moneda === "USD"
                              ? formatUSD(pago.monto_usd)
                              : formatBs(pago.monto_bs)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDate(pago.fecha)} {pago.notas ? `· ${pago.notas}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isPending && deletingPagoId === pago.id}
                          onClick={() => handleDeletePago(pago.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                          title="Eliminar este pago"
                        >
                          {deletingPagoId === pago.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

