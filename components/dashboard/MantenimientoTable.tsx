"use client";

// ============================================================
// COMPONENTE: MantenimientoTable — Historial de Mantenimientos
// components/dashboard/MantenimientoTable.tsx
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarRegistroMantenimientoAction } from "@/app/actions/mantenimiento";
import type { RegistroMantenimiento } from "@/lib/types";
import {
  Package,
  Hammer,
  CalendarDays,
  Trash2,
  Loader2,
  Store,
  Eye,
  X,
  Calculator,
  Search,
  Banknote,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface MantenimientoTableProps {
  registros: RegistroMantenimiento[];
  emptyMessage?: string;
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatBs(amount: number) {
  return (
    "Bs. " +
    (amount || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface ItemGasto {
  concepto: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  precio_bs_directo: number;
}

function limpiarNotas(notas?: string | null): string {
  if (!notas) return "";
  return notas.replace(/<!--ITEMS_JSON:[\s\S]*?-->/g, "").trim();
}

function extraerItemsRegistro(registro: RegistroMantenimiento): ItemGasto[] {
  // 1. Si existe en piezas_detalle (objeto o string)
  if (registro.piezas_detalle) {
    try {
      const data =
        typeof registro.piezas_detalle === "string"
          ? JSON.parse(registro.piezas_detalle)
          : registro.piezas_detalle;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((it: any) => {
          const cant = Math.max(1, parseInt(String(it.cantidad)) || 1);
          const cUnit = Math.max(0, parseFloat(String(it.costo_unitario ?? it.costoUSD ?? 0)) || 0);
          const sub =
            Math.max(0, parseFloat(String(it.subtotal ?? it.itemSubUSD ?? 0)) || 0) ||
            cant * cUnit;
          const pBs = Math.max(
            0,
            parseFloat(String(it.precio_bs_directo ?? it.precioBsDirecto ?? 0)) || 0
          );
          return {
            concepto: String(it.concepto || it.name || "Pieza").trim(),
            cantidad: cant,
            costo_unitario: cUnit,
            subtotal: sub,
            precio_bs_directo: pBs,
          };
        });
      }
    } catch {}
  }

  // 2. Si está serializado en registro.notas
  if (registro.notas) {
    const match = registro.notas.match(/<!--ITEMS_JSON:(.*?)-->/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        if (Array.isArray(data) && data.length > 0) {
          return data.map((it: any) => {
            const cant = Math.max(1, parseInt(String(it.cantidad)) || 1);
            const cUnit = Math.max(0, parseFloat(String(it.costo_unitario ?? it.costoUSD ?? 0)) || 0);
            const sub =
              Math.max(0, parseFloat(String(it.subtotal ?? it.itemSubUSD ?? 0)) || 0) ||
              cant * cUnit;
            const pBs = Math.max(
              0,
              parseFloat(String(it.precio_bs_directo ?? it.precioBsDirecto ?? 0)) || 0
            );
            return {
              concepto: String(it.concepto || it.name || "Pieza").trim(),
              cantidad: cant,
              costo_unitario: cUnit,
              subtotal: sub,
              precio_bs_directo: pBs,
            };
          });
        }
      } catch {}
    }
  }

  // 3. Fallback inteligente desde rep_concepto (ej: "Rodamiento, Banda")
  const concepto = (registro.rep_concepto || "").trim();
  if (!concepto) return [];

  const rawItems = concepto.split(",").map((s) => s.trim()).filter(Boolean);
  if (rawItems.length === 0) return [];

  const totalCant = Math.max(1, Number(registro.rep_cantidad) || 1);
  const totalSubUSD = Number(registro.rep_subtotal) || 0;
  const unitUSD = Number(registro.rep_costo_unitario) || (totalCant > 0 ? totalSubUSD / totalCant : 0);
  const totalBsDir = Number(registro.precio_bs_repuestos) || 0;

  return rawItems.map((raw) => {
    let name = raw;
    let cant = 1;
    let itemUnit = unitUSD;
    let explicitSub: number | null = null;

    // Verificar si viene con formato de precio o cantidad: ej "Rodamiento ($50.00)" o "Banda (x2)"
    const matchEmbedded = raw.match(
      /^(.*?)\s*\((?:(\d+)x\s*)?\$?([\d.,]+)(?:\s*=\s*\$?([\d.,]+))?\)$/i
    );
    if (matchEmbedded) {
      name = matchEmbedded[1].trim();
      cant = matchEmbedded[2] ? parseInt(matchEmbedded[2], 10) : 1;
      itemUnit = parseFloat(matchEmbedded[3].replace(/,/g, "")) || unitUSD;
      if (matchEmbedded[4]) {
        explicitSub = parseFloat(matchEmbedded[4].replace(/,/g, ""));
      }
    } else {
      const matchCant = raw.match(/^(.*?)\s*\(x?(\d+)\)$/i);
      if (matchCant) {
        name = matchCant[1].trim();
        cant = parseInt(matchCant[2], 10) || 1;
      } else if (rawItems.length === 1) {
        cant = totalCant;
      }
    }

    const itemSubUSD = explicitSub !== null ? explicitSub : cant * itemUnit;
    const itemBsDir = totalCant > 0 ? (totalBsDir / totalCant) * cant : 0;

    return {
      concepto: name,
      cantidad: cant,
      costo_unitario: itemUnit,
      subtotal: itemSubUSD,
      precio_bs_directo: itemBsDir,
    };
  });
}

// ── Modal de detalle ─────────────────────────────────────────
function DetalleModal({
  registro,
  onClose,
}: {
  registro: RegistroMantenimiento;
  onClose: () => void;
}) {
  const tasa = Number(registro.tasa_cambio) || 0;
  
  // Bolívares convertidos por tasa
  const repBs = tasa > 0 ? (Number(registro.rep_subtotal) || 0) * tasa : 0;
  const moBs = tasa > 0 ? (Number(registro.mo_costo) || 0) * tasa : 0;
  const totalBs = Number(registro.costo_bolivares) || (tasa > 0 ? (Number(registro.costo_total) || 0) * tasa : 0);

  // Bolívares directos (no convierten a USD)
  const bsDirectoPiezas = Number(registro.precio_bs_repuestos) || 0;
  const bsDirectoMano = Number(registro.precio_bs_mano_obra) || 0;
  const totalBsDirecto = bsDirectoPiezas + bsDirectoMano;

  // Gran total desembolsado en Bolívares (convertidos + directos)
  const totalDesembolsoBs = totalBs + totalBsDirecto;

  // Abono y saldo
  const abono = Number(registro.abono) || 0;
  const saldo = (Number(registro.costo_total) || 0) - abono;

  // Lista detallada de gastos de piezas
  const piezasDetalladas = extraerItemsRegistro(registro);
  const notasLimpias = limpiarNotas(registro.notas);

  // Total de items de gastos (piezas + mano de obra)
  const totalGastosCount = piezasDetalladas.length + (registro.mo_concepto ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Fondo blur */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-[#0e0e1a] shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decorativo */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
              <Package className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Detalle del Mantenimiento</h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(registro.fecha)}
                </span>
                {registro.proveedor && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Store className="h-3 w-3 text-slate-500" /> {registro.proveedor}
                  </span>
                )}
                {tasa > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <ArrowRightLeft className="h-2.5 w-2.5" />
                    1 USD = {formatBs(tasa)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">

          {/* ── 1. SECCIÓN PRINCIPAL: DESGLOSE DETALLADO DE GASTOS (CADA GASTO CON SU MONTO) ── */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-slate-900/40 to-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                  Desglose Detallado de Gastos
                </span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                {totalGastosCount} {totalGastosCount === 1 ? "gasto" : "gastos"}
              </span>
            </div>

            <div className="space-y-2">
              {/* Gastos en Piezas / Repuestos */}
              {piezasDetalladas.map((pieza, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 transition-all hover:border-amber-500/40"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {pieza.concepto}
                        </span>
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Repuesto
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>
                          Cantidad: <strong className="text-slate-200 font-mono">{pieza.cantidad}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Unitario: <strong className="text-slate-200 font-mono">{formatUSD(pieza.costo_unitario)}</strong>
                        </span>
                        {pieza.precio_bs_directo > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-purple-300 font-mono font-medium">
                              {formatBs(pieza.precio_bs_directo)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Monto
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                      {formatUSD(pieza.subtotal)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Gasto en Mano de Obra */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 transition-all hover:border-orange-500/40">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-300 shrink-0 mt-0.5">
                    <Hammer className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {registro.mo_concepto || "Mano de obra"}
                      </span>
                      <span className="text-[10px] font-medium text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        Mano de Obra
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>Servicio técnico</span>
                      {bsDirectoMano > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-purple-300 font-mono font-medium">
                            Bs. directo: {formatBs(bsDirectoMano)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Monto
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-orange-300">
                    {formatUSD(registro.mo_costo)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total acumulado de los gastos */}
            <div className="flex items-center justify-between border-t border-violet-500/20 pt-2.5 text-xs">
              <span className="text-slate-300 font-semibold">
                Suma Total de Gastos:
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-violet-200">
                {formatUSD(registro.costo_total)}
              </span>
            </div>
          </div>

          {/* ── 2. SECCIÓN AGRUPADA: PIEZA / REPUESTO ── */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Package className="h-3.5 w-3.5" /> Resumen de Piezas / Repuestos
              </p>
              {registro.rep_subtotal > 0 && (
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  Subtotal: {formatUSD(registro.rep_subtotal)}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Concepto general:</span>
                <span className="text-white font-medium text-right max-w-[65%]">
                  {registro.rep_concepto || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Cantidad total de unidades:</span>
                <span className="text-white font-medium font-mono">{registro.rep_cantidad}</span>
              </div>
              {piezasDetalladas.length === 1 && (
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Costo unitario ($):</span>
                  <span className="text-white font-medium font-mono">
                    {formatUSD(registro.rep_costo_unitario)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-300 font-semibold">Subtotal en Dólares ($):</span>
                <span className="text-amber-300 font-bold font-mono text-sm">
                  {formatUSD(registro.rep_subtotal)}
                </span>
              </div>

              {/* Bolívares convertidos de repuestos */}
              {repBs > 0 && (
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-amber-400/80">Equivalente en Bs (Tasa {tasa.toFixed(2)}):</span>
                  <span className="text-amber-200 font-bold font-mono">
                    {formatBs(repBs)}
                  </span>
                </div>
              )}

              {/* Bolívares directos de repuestos */}
              {bsDirectoPiezas > 0 && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-semibold flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5 text-purple-400" />
                      Precio Bs Directo (Piezas):
                    </span>
                    <span className="text-purple-200 font-bold font-mono text-sm">
                      {formatBs(bsDirectoPiezas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-purple-300/70">
                    <span>
                      {registro.rep_cantidad > 1
                        ? `Unitario directo: ${formatBs(bsDirectoPiezas / registro.rep_cantidad)} c/u`
                        : "Monto total directo"}
                    </span>
                    <span className="italic">Pago directo en Bs (no afecta USD)</span>
                  </div>
                </div>
              )}

              {/* Total consolidado en Bs de repuestos si ambos aplican */}
              {repBs > 0 && bsDirectoPiezas > 0 && (
                <div className="flex items-center justify-between pt-1 font-semibold text-slate-300">
                  <span>Total Repuestos en Bs (Convertido + Directo):</span>
                  <span className="font-mono text-amber-300">{formatBs(repBs + bsDirectoPiezas)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. SECCIÓN AGRUPADA: MANO DE OBRA ── */}
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                <Hammer className="h-3.5 w-3.5" /> Mano de Obra
              </p>
              {registro.mo_costo > 0 ? (
                <span className="font-mono text-xs font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-md">
                  Subtotal: {formatUSD(registro.mo_costo)}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  $0.00
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-1.5">
                <span className="text-slate-400">Descripción:</span>
                <span className="text-white font-medium text-right max-w-[65%]">
                  {registro.mo_concepto || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-slate-300 font-semibold">Costo en Dólares ($):</span>
                <span className="text-orange-300 font-bold font-mono text-sm">
                  {formatUSD(registro.mo_costo)}
                </span>
              </div>

              {/* Bolívares convertidos de mano de obra */}
              {moBs > 0 && (
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-orange-400/80">Equivalente en Bs (Tasa {tasa.toFixed(2)}):</span>
                  <span className="text-orange-200 font-bold font-mono">
                    {formatBs(moBs)}
                  </span>
                </div>
              )}

              {/* Bolívares directos de mano de obra */}
              {bsDirectoMano > 0 && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-semibold flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5 text-purple-400" />
                      Precio Bs Directo (Mano de Obra):
                    </span>
                    <span className="text-purple-200 font-bold font-mono text-sm">
                      {formatBs(bsDirectoMano)}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-300/70 italic text-right">
                    Pago directo en Bs (no afecta USD)
                  </div>
                </div>
              )}

              {/* Total consolidado en Bs de mano de obra si ambos aplican */}
              {moBs > 0 && bsDirectoMano > 0 && (
                <div className="flex items-center justify-between pt-1 font-semibold text-slate-300">
                  <span>Total M.O. en Bs (Convertido + Directo):</span>
                  <span className="font-mono text-orange-300">{formatBs(moBs + bsDirectoMano)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. RESUMEN GENERAL Y TOTALES ── */}
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-3">
            {/* Total USD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-violet-300">
                <Calculator className="h-4 w-4 text-violet-400" />
                <span className="font-semibold uppercase tracking-wider">
                  Total Mantenimiento (USD)
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-violet-200">
                {formatUSD(registro.costo_total)}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-violet-500/20 pt-2">
              <span>Fórmula en Dólares ($):</span>
              <span className="font-mono text-slate-300">
                Piezas: <strong className="text-amber-300">{formatUSD(registro.rep_subtotal)}</strong> + M.O.:{" "}
                <strong className="text-orange-300">{formatUSD(registro.mo_costo)}</strong>
              </span>
            </div>

            {/* Desglose en Bolívares */}
            <div className="space-y-2 border-t border-violet-500/20 pt-2 text-xs">
              {totalBs > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400/90 flex items-center gap-1">
                    <ArrowRightLeft className="h-3 w-3 text-cyan-400" />
                    Bolívares por Conversión (USD × Tasa):
                  </span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {formatBs(totalBs)}
                  </span>
                </div>
              )}

              {totalBsDirecto > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 flex items-center gap-1">
                    <Banknote className="h-3 w-3 text-purple-400" />
                    Bolívares Directos (Sin conv. a $):
                  </span>
                  <span className="font-mono font-bold text-purple-300 text-sm">
                    {formatBs(totalBsDirecto)}
                  </span>
                </div>
              )}

              {/* Desglose de bolívares directos si hay piezas y MO */}
              {bsDirectoPiezas > 0 && bsDirectoMano > 0 && (
                <div className="flex items-center justify-end text-[11px] text-purple-400/80 font-mono gap-2">
                  <span>(Piezas: {formatBs(bsDirectoPiezas)}</span>
                  <span>+ M.O.: {formatBs(bsDirectoMano)})</span>
                </div>
              )}

              {/* Total Desembolso en Bolívares */}
              {totalBsDirecto > 0 && totalBs > 0 && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 flex items-center justify-between mt-1">
                  <div>
                    <span className="text-xs font-bold text-cyan-200 block">
                      Total Desembolso en Bolívares:
                    </span>
                    <span className="text-[10px] text-cyan-400/70">
                      Convertidos ({formatBs(totalBs)}) + Directos ({formatBs(totalBsDirecto)})
                    </span>
                  </div>
                  <span className="font-mono text-base font-extrabold text-cyan-300">
                    {formatBs(totalDesembolsoBs)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Abono y Saldo */}
          {abono > 0 && (
            <div
              className={`rounded-2xl border p-4 space-y-2 ${
                saldo <= 0
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-amber-500/30 bg-amber-500/10"
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  saldo <= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                {saldo <= 0 ? "✅ Cancelado" : "⏳ Pago Parcial"}
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Total del mantenimiento:</span>
                  <span className="font-mono font-bold text-violet-300">
                    {formatUSD(registro.costo_total)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400">Abono recibido:</span>
                  <span className="font-mono font-bold text-green-300">
                    − {formatUSD(abono)}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between pt-1 font-semibold ${
                    saldo <= 0 ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  <span>{saldo <= 0 ? "Saldo:" : "Saldo pendiente:"}</span>
                  <span className="font-mono text-sm">
                    {saldo <= 0 ? formatUSD(0) : formatUSD(saldo)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {notasLimpias && (
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Notas / Observaciones:
              </span>
              <p className="text-xs text-slate-300 italic whitespace-pre-line">
                {notasLimpias}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tabla ────────────────────────────────────────────────────
export function MantenimientoTable({
  registros,
  emptyMessage = "Sin registros de mantenimiento aún.",
}: MantenimientoTableProps) {
  const router = useRouter();
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroMantenimiento | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    setDeletingId(id);
    try {
      const res = await eliminarRegistroMantenimientoAction(id);
      if (!res.success) {
        alert(res.error || "Error al eliminar");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err?.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  if (registros.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-600 mb-3" strokeWidth={1} />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  const filteredRegistros = registros.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.rep_concepto.toLowerCase().includes(q) ||
      r.mo_concepto.toLowerCase().includes(q) ||
      (r.proveedor && r.proveedor.toLowerCase().includes(q)) ||
      (r.notas && r.notas.toLowerCase().includes(q)) ||
      formatDate(r.fecha).toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Modal */}
      {selectedRegistro && (
        <DetalleModal
          registro={selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
        />
      )}

      {/* Buscador */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por repuesto, mano de obra, proveedor o fecha..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
        />
      </div>

      <div className="space-y-2">
        {filteredRegistros.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-6">
            No se encontraron resultados para "{searchQuery}".
          </p>
        ) : (
          filteredRegistros.map((r) => {
            const tasa = r.tasa_cambio || 0;
            const totalBs = r.costo_bolivares || (tasa > 0 ? r.costo_total * tasa : 0);

            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/[0.07]"
              >
                {/* Fecha */}
                <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-500 min-w-[90px]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(r.fecha)}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 rounded-md px-2 py-0.5 truncate max-w-[130px]">
                    <Package className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.rep_concepto}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 rounded-md px-2 py-0.5 truncate max-w-[130px]">
                    <Hammer className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.mo_concepto}</span>
                  </span>
                </div>

                {/* Total */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-violet-300 text-sm block">
                    {formatUSD(r.costo_total)}
                  </span>
                  {totalBs > 0 && (
                    <span className="font-mono text-[11px] text-cyan-400 block">
                      {formatBs(totalBs)}
                    </span>
                  )}
                  {((Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0)) > 0 && (
                    <span className="font-mono text-[10px] text-purple-300 block font-semibold" title="Bolívares directos">
                      +{formatBs((Number(r.precio_bs_repuestos) || 0) + (Number(r.precio_bs_mano_obra) || 0))} Bs
                    </span>
                  )}
                  {/* Indicador de abono y saldo */}
                  {(Number(r.abono) || 0) > 0 && (() => {
                    const rAbono = Number(r.abono) || 0;
                    const rSaldo = r.costo_total - rAbono;
                    return (
                      <>
                        <span className="font-mono text-[10px] text-green-400 block font-semibold">
                          Abono: {formatUSD(rAbono)}
                        </span>
                        {rSaldo > 0 ? (
                          <span className="font-mono text-[10px] text-amber-400 block font-bold">
                            Debe: {formatUSD(rSaldo)}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-emerald-400 block font-bold">
                            ✓ Cancelado
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Ojo — abre modal */}
                  <button
                    onClick={() => setSelectedRegistro(r)}
                    title="Ver detalle"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    title="Eliminar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
