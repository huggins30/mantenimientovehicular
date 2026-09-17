"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Droplets, CalendarDays, Wrench, DollarSign, Banknote, Trash2, Loader2 } from "lucide-react";
import { MantenimientoTable } from "@/components/dashboard/MantenimientoTable";
import { eliminarCambioAceiteAction } from "@/app/actions/unidades";
import type { RegistroMantenimiento, MantenimientoAceite } from "@/lib/types";

interface ReporteMantenimientoProps {
  registros: RegistroMantenimiento[];
  cambiosAceite: MantenimientoAceite[];
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount || 0);
}

function formatBs(amount: number): string {
  return "Bs. " + (amount || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatKm(km: number): string {
  return new Intl.NumberFormat("es-VE").format(km) + " km";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
}

function TotalesCards({ totalUSD, totalBs, labelUSD, labelBs }: { totalUSD: number; totalBs: number; labelUSD: string; labelBs: string; }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 flex items-center gap-4">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 shrink-0">
          <DollarSign className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{labelUSD}</p>
          <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{formatUSD(totalUSD)}</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 flex items-center gap-4">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 ring-1 ring-cyan-500/30 shrink-0">
          <Banknote className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{labelBs}</p>
          <p className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
            {totalBs > 0 ? formatBs(totalBs) : <span className="text-slate-600 text-sm">Sin registros en Bs</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function CambiosAceiteTab({
  cambios,
  onDeleted,
}: {
  cambios: MantenimientoAceite[];
  onDeleted?: (id: number) => void;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de cambio de aceite?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await eliminarCambioAceiteAction(id);
      if (!res.success) {
        alert(res.error || "No se pudo eliminar el registro de cambio de aceite.");
      } else {
        onDeleted?.(id);
        router.refresh();
      }
    } catch (err: any) {
      alert(err?.message || "Ocurrió un error al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  if (cambios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20 mb-4">
          <Droplets className="h-8 w-8 text-cyan-400" strokeWidth={1.5} />
        </div>
        <p className="text-slate-400 text-sm font-medium">Sin registros de cambios de aceite</p>
        <p className="text-slate-600 text-xs mt-1">Los cambios de aceite apareceran aqui una vez registrados.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 shrink-0">
            <Droplets className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Cambios</p>
            <p className="text-lg font-bold text-cyan-300">{cambios.length}</p>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 shrink-0">
            <Wrench className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Ultimo KM registrado</p>
            <p className="text-lg font-bold text-emerald-300">{cambios.length > 0 ? formatKm(cambios[0].kilometraje_servicio) : "-"}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Tipo de Aceite</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-500">KM Servicio</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-500">Proximo KM</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-500">Costo (USD)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Notas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 w-16">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cambios.map((cambio, idx) => (
                <tr key={cambio.id} className={`transition-colors hover:bg-white/5 ${idx === 0 ? "bg-cyan-500/5" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-500 shrink-0" strokeWidth={1.5} />
                      <span className={`text-sm font-medium ${idx === 0 ? "text-cyan-300" : "text-slate-300"}`}>
                        {formatDate(cambio.fecha_servicio)}
                        {idx === 0 && <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Ultimo</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-500/50 shrink-0" strokeWidth={1.5} />
                      <span className="text-slate-300">{cambio.tipo_aceite}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">{formatKm(cambio.kilometraje_servicio)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatKm(cambio.proximo_kilometraje)}</td>
                  <td className="px-4 py-3 text-right"><span className="font-mono font-semibold text-emerald-300">{formatUSD(cambio.costo_servicio)}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">{cambio.notas || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(cambio.id)}
                      disabled={deletingId === cambio.id}
                      title="Eliminar este cambio de aceite"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                    >
                      {deletingId === cambio.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ReporteMantenimiento({ registros, cambiosAceite }: ReporteMantenimientoProps) {
  const [activeTab, setActiveTab] = useState<"repuestos" | "aceite">("repuestos");
  const [cambiosList, setCambiosList] = useState<MantenimientoAceite[]>(cambiosAceite);

  useEffect(() => {
    setCambiosList(cambiosAceite);
  }, [cambiosAceite]);

  const repTotalUSD = registros.reduce((sum, r) => sum + (r.costo_total || 0), 0);
  const repTotalBs = registros.reduce((sum, r) => {
    const bsDirecto = (r.precio_bs_repuestos || 0) + (r.precio_bs_mano_obra || 0);
    const bsConvertido = r.costo_bolivares || 0;
    return sum + (bsDirecto > 0 ? bsDirecto : bsConvertido);
  }, 0);

  const aceiteTotalUSD = cambiosList.reduce((sum, c) => sum + (c.costo_servicio || 0), 0);
  const aceiteTotalBs = 0;

  const tabs = [
    { id: "repuestos" as const, label: "Piezas y Repuestos", icon: Package, count: registros.length, color: "violet" },
    { id: "aceite" as const, label: "Cambios de Aceite", icon: Droplets, count: cambiosList.length, color: "cyan" },
  ];

  const totalUSD = activeTab === "repuestos" ? repTotalUSD : aceiteTotalUSD;
  const totalBs  = activeTab === "repuestos" ? repTotalBs  : aceiteTotalBs;

  return (
    <div className="space-y-5">
      <TotalesCards
        totalUSD={totalUSD}
        totalBs={totalBs}
        labelUSD={activeTab === "repuestos" ? "Total Gastos en Dolares - Repuestos" : "Total Gastos en Dolares - Aceite"}
        labelBs={activeTab === "repuestos" ? "Total Gastos en Bolivares - Repuestos" : "Total Gastos en Bolivares - Aceite"}
      />
      <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`reporte-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? (tab.color === "violet" ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10" : "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10") : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>{tab.label}</span>
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? (tab.color === "violet" ? "bg-violet-500/30 text-violet-200" : "bg-cyan-500/30 text-cyan-200") : "bg-white/10 text-slate-500"}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>
      <div key={activeTab}>
        {activeTab === "repuestos" ? (
          <MantenimientoTable registros={registros} />
        ) : (
          <CambiosAceiteTab
            cambios={cambiosList}
            onDeleted={(deletedId) => setCambiosList((prev) => prev.filter((c) => c.id !== deletedId))}
          />
        )}
      </div>
    </div>
  );
}

