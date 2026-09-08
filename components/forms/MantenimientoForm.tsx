"use client";

// ============================================================
// COMPONENTE: MantenimientoForm — Formulario único combinado
// Piezas / Repuesto + Mano de Obra con montos en USD y Bs
// components/forms/MantenimientoForm.tsx
// ============================================================

import { useActionState, useState, useEffect } from "react";
import { registrarMantenimientoAction } from "@/app/actions/mantenimiento";
import type { ActionResult, Unidad, RegistroMantenimiento } from "@/lib/types";
import {
  Package,
  Hammer,
  Hash,
  DollarSign,
  CalendarDays,
  Store,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Save,
  Banknote,
  Plus,
  Trash2,
} from "lucide-react";

interface MantenimientoFormProps {
  unidad: Unidad;
}

interface PiezaItem {
  id: string;
  concepto: string;
  cantidad: number | string;
  costoUSD: string;
  precioBsDirecto: string;
}

const initialState: ActionResult<RegistroMantenimiento> = { success: false };

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

export function MantenimientoForm({ unidad }: MantenimientoFormProps) {
  const [state, action, isPending] = useActionState(
    registrarMantenimientoAction,
    initialState
  );

  const [piezas, setPiezas] = useState<PiezaItem[]>([
    { id: "1", concepto: "", cantidad: 1, costoUSD: "", precioBsDirecto: "" },
  ]);

  const [costoManoUSD, setCostoManoUSD] = useState<string>("");

  // Precio en Bs DIRECTO para Mano de Obra — no influye en la conversión a USD
  const [precioBsMano, setPrecioBsMano] = useState<string>("");

  // Abono (adelanto recibido, en USD)
  const [abono, setAbono] = useState<string>("");

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      setPiezas([{ id: "1", concepto: "", cantidad: 1, costoUSD: "", precioBsDirecto: "" }]);
      setCostoManoUSD("");
      setPrecioBsMano("");
      setAbono("");
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const agregarPieza = () => {
    setPiezas((prev) => [
      ...prev,
      { id: Date.now().toString(), concepto: "", cantidad: 1, costoUSD: "", precioBsDirecto: "" },
    ]);
  };

  const eliminarPieza = (id: string) => {
    if (piezas.length <= 1) return;
    setPiezas((prev) => prev.filter((p) => p.id !== id));
  };

  const actualizarPieza = (id: string, campo: keyof PiezaItem, valor: any) => {
    setPiezas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  // Cálculos acumulados de todas las piezas
  // SOLO el campo costoUSD afecta el total en dólares
  let totalRepUSD = 0;
  let totalPiezasCount = 0;
  let totalBsDirectoRepuestos = 0;

  const piezasCalculadas = piezas.map((p) => {
    const cant = Math.max(1, parseInt(String(p.cantidad)) || 1);
    const cUSD = parseFloat(p.costoUSD) || 0;
    const cBsDir = parseFloat(p.precioBsDirecto) || 0;

    // Subtotal USD de esta pieza = cantidad × costo unitario USD
    const itemSubUSD = cant * cUSD;
    // Precio Bs directo total de esta pieza (informativo, no afecta USD)
    const itemBsDirecto = cant * cBsDir;

    totalRepUSD += itemSubUSD;
    totalPiezasCount += cant;
    totalBsDirectoRepuestos += itemBsDirecto;

    return {
      ...p,
      cant,
      cUSD,
      cBsDir,
      itemSubUSD,
      itemBsDirecto,
    };
  });

  const subtotalRepUSD = totalRepUSD;

  const numCostoManoUSD = parseFloat(costoManoUSD) || 0;
  const subtotalManoUSD = numCostoManoUSD;

  // Total General en USD = Piezas + Mano de Obra (solo montos USD)
  const totalGeneralUSD = subtotalRepUSD + subtotalManoUSD;

  // Abono y saldo pendiente
  const numAbono = parseFloat(abono) || 0;
  const saldoPendiente = totalGeneralUSD - numAbono;

  const nombresConcatenados = piezas
    .filter((p) => p.concepto.trim() !== "")
    .map((p) => {
      const c = parseInt(String(p.cantidad)) || 1;
      return c > 1 ? `${p.concepto.trim()} (x${c})` : p.concepto.trim();
    })
    .join(", ");

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/30">
          <Package className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Registrar Mantenimiento</h3>
          <p className="text-xs text-slate-500">
            {unidad.numero_unidad || unidad.placa} — {unidad.marca} {unidad.modelo}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Mantenimiento registrado correctamente.
        </div>
      )}
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="unidad_id" value={unidad.id} />
        <input type="hidden" name="piezas_json" value={JSON.stringify(piezas)} />
        <input type="hidden" name="rep_concepto" value={nombresConcatenados} />
        <input type="hidden" name="rep_cantidad" value={totalPiezasCount} />
        <input type="hidden" name="precio_bs_repuestos" value={totalBsDirectoRepuestos} />
        <input type="hidden" name="precio_bs_mano_obra" value={precioBsMano} />
        <input type="hidden" name="abono" value={abono} />
        {/* tasa_cambio ya no se usa en los cálculos pero lo enviamos vacío para compatibilidad */}
        <input type="hidden" name="tasa_cambio" value="" />

        {/* ── Fecha + Proveedor ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="fecha" className="block text-xs font-medium text-slate-400">
              Fecha <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proveedor" className="block text-xs font-medium text-slate-400">
              Proveedor <span className="text-slate-600">(opcional)</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="proveedor"
                name="proveedor"
                type="text"
                placeholder="Ej: Repuestos El Motor"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: Piezas de Repuesto (Múltiples piezas) ── */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Piezas de Repuesto
              </span>
              <span className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {piezas.length} {piezas.length === 1 ? "pieza" : "piezas"}
              </span>
            </div>
            {subtotalRepUSD > 0 && (
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-md px-2 py-0.5">
                Subtotal: {formatUSD(subtotalRepUSD)}
              </span>
            )}
          </div>

          {/* Lista de piezas dinámicas */}
          <div className="space-y-3">
            {piezasCalculadas.map((p, index) => (
              <div
                key={p.id}
                className="relative rounded-xl border border-amber-500/20 bg-black/30 p-3.5 space-y-3 transition-all hover:border-amber-500/40"
              >
                {/* Header de la pieza individual */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-300">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      Pieza #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.itemSubUSD > 0 && (
                      <span className="font-mono text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {formatUSD(p.itemSubUSD)}
                      </span>
                    )}

                    {piezas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarPieza(p.id)}
                        title="Eliminar esta pieza"
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Nombre de la pieza */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Nombre de la pieza <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ej: Pastillas de freno, Filtro de aire, Amortiguador..."
                      required
                      value={p.concepto}
                      onChange={(e) => actualizarPieza(p.id, "concepto", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Cantidad (debajo del nombre de la pieza) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Cantidad <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={p.cantidad}
                      onChange={(e) => actualizarPieza(p.id, "cantidad", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Tres campos: Costo USD | Monto Bs (read-only, calculado) | Precio Bs Directo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Costo Unitario USD */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-400">
                      Costo Unit. ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={p.costoUSD}
                        onChange={(e) => actualizarPieza(p.id, "costoUSD", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>

                  {/* Monto Unitario Bs — informativo = costo USD × cantidad (read-only display) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-400">
                      Subtotal ($)
                    </label>
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-slate-300 h-[38px]">
                      {p.itemSubUSD > 0 ? formatUSD(p.itemSubUSD) : <span className="text-slate-600">—</span>}
                    </div>
                  </div>

                  {/* Precio Bs Directo (NO convierte a USD) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-purple-400">
                      Precio Bs
                    </label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400/70" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={p.precioBsDirecto}
                        onChange={(e) => actualizarPieza(p.id, "precioBsDirecto", e.target.value)}
                        className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 pl-9 pr-3 py-2 text-sm font-mono text-purple-200 placeholder-slate-500 outline-none transition-all hover:border-purple-500/50 focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Subtotal Bs Directo por pieza (si tiene valor) */}
                {p.itemBsDirecto > 0 && (
                  <div className="flex items-center justify-end gap-1.5 text-[11px] text-purple-400/80 font-mono">
                    <Banknote className="h-3 w-3" />
                    Bs directo: {formatBs(p.itemBsDirecto)}
                    {p.cant > 1 && <span className="text-purple-400/60">({p.cant} × {formatBs(p.cBsDir)})</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón para agregar más piezas */}
          <button
            type="button"
            onClick={agregarPieza}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-xs font-semibold transition-all duration-200 hover:border-amber-500/60 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            + Agregar otra pieza de repuesto
          </button>

          {/* Subtotal consolidado de todas las piezas */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Calculator className="h-3.5 w-3.5" />
                Subtotal Piezas ({totalPiezasCount} {totalPiezasCount === 1 ? "unidad" : "unidades"} en {piezas.length} {piezas.length === 1 ? "ítem" : "ítems"})
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                {formatUSD(subtotalRepUSD)}
              </span>
            </div>
          </div>

          {/* Total Bs Directo de todas las piezas (si hay) */}
          {totalBsDirectoRepuestos > 0 && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Banknote className="h-3.5 w-3.5" />
                  Total Precio Bs (Directo — Piezas)
                  <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 ml-1">No afecta $</span>
                </span>
                <span className="font-mono text-sm font-bold text-purple-300">
                  {formatBs(totalBsDirectoRepuestos)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── SECCIÓN: Mano de Obra ── */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Mano de Obra
              </span>
            </div>
            {subtotalManoUSD > 0 && (
              <span className="font-mono text-xs font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 rounded-md px-2 py-0.5">
                Subtotal: {formatUSD(subtotalManoUSD)}
              </span>
            )}
          </div>

          {/* Concepto */}
          <div className="space-y-1.5">
            <label htmlFor="mo_concepto" className="block text-xs font-medium text-slate-400">
              Descripción del servicio <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Hammer className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                id="mo_concepto"
                name="mo_concepto"
                type="text"
                placeholder="Ej: Cambio de pastillas de freno"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
          </div>

          {/* Costo USD | Subtotal (read-only) | Precio Bs Directo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Costo Mano de Obra USD */}
            <div className="space-y-1.5">
              <label htmlFor="mo_costo" className="block text-xs font-medium text-slate-400">
                Costo M.O. ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="mo_costo"
                  name="mo_costo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={costoManoUSD}
                  onChange={(e) => setCostoManoUSD(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all hover:border-white/20 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40"
                />
              </div>
            </div>

            {/* Subtotal M.O. (informativo, read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Subtotal ($)
              </label>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-mono text-slate-300 h-[42px]">
                {subtotalManoUSD > 0 ? formatUSD(subtotalManoUSD) : <span className="text-slate-600">—</span>}
              </div>
            </div>

            {/* Precio Bs Directo M.O. (NO convierte a USD) */}
            <div className="space-y-1.5">
              <label htmlFor="mo_precio_bs" className="block text-xs font-medium text-purple-400">
                Precio Bs
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400/70" />
                <input
                  id="mo_precio_bs"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={precioBsMano}
                  onChange={(e) => setPrecioBsMano(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 pl-9 pr-3 py-2.5 text-sm font-mono text-purple-200 placeholder-slate-500 outline-none transition-all hover:border-purple-500/50 focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40"
                />
              </div>
            </div>
          </div>

          {/* Total Bs Directo Mano de Obra (si hay) */}
          {(parseFloat(precioBsMano) || 0) > 0 && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Banknote className="h-3.5 w-3.5" />
                  Precio Bs (Directo — M.O.)
                  <span className="text-[10px] text-purple-400/60 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 ml-1">No afecta $</span>
                </span>
                <span className="font-mono text-sm font-bold text-purple-300">
                  {formatBs(parseFloat(precioBsMano) || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Abono (Adelanto recibido) ── */}
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/20">
              <DollarSign className="h-3.5 w-3.5 text-green-400" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
              Abono / Adelanto
            </span>
            <span className="text-[11px] text-green-400/60 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              Opcional
            </span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="abono_input" className="block text-xs font-medium text-slate-400">
              Abono recibido ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-400/70" />
              <input
                id="abono_input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={abono}
                onChange={(e) => setAbono(e.target.value)}
                className="w-full rounded-xl border border-green-500/30 bg-green-500/10 pl-9 pr-3 py-2.5 text-sm font-mono text-green-200 placeholder-slate-500 outline-none transition-all hover:border-green-500/50 focus:border-green-400 focus:ring-1 focus:ring-green-500/40"
              />
            </div>
          </div>

          {/* Preview saldo si hay abono */}
          {numAbono > 0 && totalGeneralUSD > 0 && (
            <div className={`rounded-lg px-3 py-2.5 flex items-center justify-between text-sm font-mono font-bold border ${
              saldoPendiente <= 0
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            }`}>
              <span className="text-xs font-semibold">
                {saldoPendiente <= 0 ? "✅ Saldo: CANCELADO" : "⏳ Saldo pendiente:"}
              </span>
              <span>
                {saldoPendiente <= 0 ? formatUSD(0) : formatUSD(saldoPendiente)}
              </span>
            </div>
          )}
        </div>

        {/* ── Total General (Incluye Piezas y Repuesto y Mano de Obra) ── */}
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Calculator className="h-4 w-4 text-violet-400" />
              <span className="font-semibold uppercase tracking-wider">
                Total Mantenimiento (USD)
              </span>
            </div>
            <span className="font-mono text-lg font-bold text-violet-200">
              {formatUSD(totalGeneralUSD)}
            </span>
          </div>

          <div className="border-t border-violet-500/20 pt-2 space-y-1.5">
            {/* ── Resumen Bs Directo ── */}
            {(totalBsDirectoRepuestos > 0 || (parseFloat(precioBsMano) || 0) > 0) && (
              <div className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5 text-purple-400" />
                  Gasto en Bs (Directo):
                </span>
                <span className="font-mono text-sm font-bold text-purple-300">
                  {formatBs(totalBsDirectoRepuestos + (parseFloat(precioBsMano) || 0))}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1">
              <span>Incluye Piezas y Mano de Obra:</span>
              <span className="font-mono text-slate-300">
                Piezas: <strong className="text-amber-300">{formatUSD(subtotalRepUSD)}</strong> + Mano de Obra: <strong className="text-orange-300">{formatUSD(subtotalManoUSD)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── Notas ── */}
        <div className="space-y-1.5">
          <label htmlFor="notas" className="block text-xs font-medium text-slate-400">
            Notas <span className="text-slate-600">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
            <textarea
              id="notas"
              name="notas"
              rows={2}
              placeholder="Observaciones adicionales del mantenimiento..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none hover:border-white/20 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Mantenimiento
            </>
          )}
        </button>
      </form>
    </div>
  );
}
