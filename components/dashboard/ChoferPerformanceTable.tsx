"use client";

// ============================================================
// COMPONENTE: ChoferPerformanceTable — Rendimiento de Choferes
// components/dashboard/ChoferPerformanceTable.tsx
// ============================================================

import { useState, useMemo } from "react";
import type { ChoferPerformanceGroup, ChoferIngresoDetalle } from "@/lib/types";
import {
  Eye,
  X,
  Search,
  Users,
  Car,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Receipt,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
} from "lucide-react";

interface ChoferPerformanceTableProps {
  grupos: ChoferPerformanceGroup[];
}

type SortField = "operador" | "unidad" | "viajes" | "ingreso";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 10;

function formatCurrency(amount: number) {
  return (
    "Bs. " +
    amount.toLocaleString("es-VE", {
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

function SortIcon({
  field,
  currentField,
  currentOrder,
}: {
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
}) {
  if (field !== currentField) {
    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-40 group-hover/col:opacity-100 transition-opacity" />
    );
  }
  return currentOrder === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-indigo-400 font-bold animate-in fade-in zoom-in-75 duration-150" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-indigo-400 font-bold animate-in fade-in zoom-in-75 duration-150" />
  );
}

export function ChoferPerformanceTable({ grupos }: ChoferPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<ChoferPerformanceGroup | null>(null);
  const [page, setPage] = useState(0);

  // Estados de ordenamiento
  const [sortField, setSortField] = useState<SortField>("ingreso");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      // Alternar dirección
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // Nuevo campo: por defecto 'asc' para texto y 'desc' para números
      setSortField(field);
      setSortOrder(field === "operador" || field === "unidad" ? "asc" : "desc");
    }
    setPage(0);
  }

  // Filtrado por búsqueda (operador o unidad)
  const filteredGrupos = useMemo(() => {
    if (!searchTerm.trim()) return grupos;
    const term = searchTerm.toLowerCase();
    return grupos.filter(
      (g) =>
        g.operador.toLowerCase().includes(term) ||
        g.numero_unidad.toLowerCase().includes(term) ||
        g.placa.toLowerCase().includes(term)
    );
  }, [grupos, searchTerm]);

  // Ordenamiento de los datos según sortField y sortOrder
  const sortedGrupos = useMemo(() => {
    const list = [...filteredGrupos];

    list.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "operador":
          comparison = a.operador.localeCompare(b.operador, "es", { sensitivity: "base" });
          break;

        case "unidad": {
          const numA = parseInt(a.numero_unidad.replace(/\D/g, ""), 10);
          const numB = parseInt(b.numero_unidad.replace(/\D/g, ""), 10);
          if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
            comparison = numA - numB;
          } else {
            comparison = (a.numero_unidad || a.placa).localeCompare(
              b.numero_unidad || b.placa,
              "es",
              { numeric: true }
            );
          }
          break;
        }

        case "viajes":
          comparison = a.total_viajes - b.total_viajes;
          break;

        case "ingreso":
        default:
          comparison = a.ingreso_total - b.ingreso_total;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [filteredGrupos, sortField, sortOrder]);

  // Paginación sobre la lista ordenada
  const totalPages = Math.max(1, Math.ceil(sortedGrupos.length / PAGE_SIZE));
  const currentPageGrupos = useMemo(() => {
    return sortedGrupos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [sortedGrupos, page]);

  // Métricas generales
  const totalIngresoGeneral = useMemo(() => {
    return grupos.reduce((acc, g) => acc + g.ingreso_total, 0);
  }, [grupos]);

  const totalViajesGeneral = useMemo(() => {
    return grupos.reduce((acc, g) => acc + g.total_viajes, 0);
  }, [grupos]);

  const operadoresUnicos = useMemo(() => {
    return new Set(grupos.map((g) => g.operador)).size;
  }, [grupos]);

  const mejorOperador = useMemo(() => {
    if (grupos.length === 0) return null;
    return [...grupos].sort((a, b) => b.ingreso_total - a.ingreso_total)[0];
  }, [grupos]);

  return (
    <div className="space-y-6">
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total recaudado */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Ingreso Total Choferes
            </p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">
              {formatCurrency(totalIngresoGeneral)}
            </p>
            <p className="text-xs text-slate-400">Todas las unidades</p>
          </div>
        </div>

        {/* Operadores activos */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
              Operadores Activos
            </p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">
              {operadoresUnicos}
            </p>
            <p className="text-xs text-slate-400">Choferes registrados</p>
          </div>
        </div>

        {/* Total Viajes / Registros */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Viajes Registrados
            </p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">
              {totalViajesGeneral}
            </p>
            <p className="text-xs text-slate-400">Fletes y servicios</p>
          </div>
        </div>

        {/* Mejor Rendimiento */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Award className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Mayor Rendimiento
            </p>
            <p className="text-lg font-bold text-white truncate mt-0.5" title={mejorOperador?.operador}>
              {mejorOperador ? mejorOperador.operador : "N/A"}
            </p>
            <p className="text-xs text-amber-400/80 font-mono">
              {mejorOperador ? formatCurrency(mejorOperador.ingreso_total) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y CONTROLES DE ORDENAMIENTO */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por operador o unidad..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPage(0);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtros de Ordenamiento: Campo y Dirección (Asc/Desc) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de campo */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Ordenar por:</span>
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as SortField);
                setPage(0);
              }}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ingreso" className="bg-slate-900 text-white">Ingreso Total</option>
              <option value="operador" className="bg-slate-900 text-white">Operador</option>
              <option value="unidad" className="bg-slate-900 text-white">Número de Unidad</option>
              <option value="viajes" className="bg-slate-900 text-white">Viajes Realizados</option>
            </select>
          </div>

          {/* Botón de Dirección: Ascendente / Descendente */}
          <button
            type="button"
            onClick={() => {
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
              setPage(0);
            }}
            className={`
              flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-sm
              ${
                sortOrder === "asc"
                  ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 shadow-indigo-500/15"
                  : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 shadow-indigo-500/10"
              }
            `}
            title={sortOrder === "asc" ? "Orden actual: Ascendente. Haz clic para cambiar a Descendente" : "Orden actual: Descendente. Haz clic para cambiar a Ascendente"}
          >
            {sortOrder === "asc" ? (
              <>
                <ArrowUpWideNarrow className="h-4 w-4 text-indigo-400" />
                <span>Ascendente</span>
              </>
            ) : (
              <>
                <ArrowDownWideNarrow className="h-4 w-4 text-indigo-400" />
                <span>Descendente</span>
              </>
            )}
          </button>

          <div className="text-xs text-slate-400 ml-auto lg:ml-2">
            {sortedGrupos.length} {sortedGrupos.length === 1 ? "registro" : "registros"}
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      {sortedGrupos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 text-indigo-400">
            <Users className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-slate-300">No se encontraron registros de choferes</p>
          <p className="text-xs text-slate-500">
            {searchTerm
              ? "Prueba cambiando el término de búsqueda."
              : "Los ingresos registrados con operador aparecerán automáticamente aquí."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  {/* Columna: Operador */}
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleSort("operador")}
                      className="group/col flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                      title="Ordenar por Operador (Haz clic para alternar Ascendente / Descendente)"
                    >
                      <span className={sortField === "operador" ? "text-indigo-300 font-bold" : ""}>
                        Operador
                      </span>
                      <SortIcon field="operador" currentField={sortField} currentOrder={sortOrder} />
                    </button>
                  </th>

                  {/* Columna: Número de Unidad */}
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleSort("unidad")}
                      className="group/col flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                      title="Ordenar por Número de Unidad (Haz clic para alternar Ascendente / Descendente)"
                    >
                      <span className={sortField === "unidad" ? "text-indigo-300 font-bold" : ""}>
                        Número de Unidad
                      </span>
                      <SortIcon field="unidad" currentField={sortField} currentOrder={sortOrder} />
                    </button>
                  </th>

                  {/* Columna: Viajes Realizados */}
                  <th className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("viajes")}
                      className="group/col inline-flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
                      title="Ordenar por Viajes Realizados (Haz clic para alternar Ascendente / Descendente)"
                    >
                      <span className={sortField === "viajes" ? "text-indigo-300 font-bold" : ""}>
                        Viajes Realizados
                      </span>
                      <SortIcon field="viajes" currentField={sortField} currentOrder={sortOrder} />
                    </button>
                  </th>

                  {/* Columna: Ingreso Total */}
                  <th className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("ingreso")}
                      className="group/col inline-flex items-center gap-1.5 ml-auto hover:text-white transition-colors focus:outline-none"
                      title="Ordenar por Ingreso Total (Haz clic para alternar Ascendente / Descendente)"
                    >
                      <span className={sortField === "ingreso" ? "text-indigo-300 font-bold" : ""}>
                        Ingreso Total
                      </span>
                      <SortIcon field="ingreso" currentField={sortField} currentOrder={sortOrder} />
                    </button>
                  </th>

                  {/* Columna: Acción */}
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentPageGrupos.map((grupo) => {
                  const isTop =
                    mejorOperador &&
                    grupo.ingreso_total === mejorOperador.ingreso_total &&
                    mejorOperador.ingreso_total > 0;

                  return (
                    <tr
                      key={`${grupo.operador}__${grupo.unidad_id}`}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Operador */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 font-bold text-xs ring-1 ring-indigo-500/30">
                            {grupo.operador.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                {grupo.operador}
                              </span>
                              {isTop && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                  <Sparkles className="h-3 w-3" /> Top
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">Conductor</span>
                          </div>
                        </div>
                      </td>

                      {/* Número de Unidad */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 border border-white/10">
                            <Car className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white">
                              {grupo.numero_unidad.toLowerCase().includes("unidad")
                                ? grupo.numero_unidad
                                : `Unidad ${grupo.numero_unidad}`}
                            </span>
                            <p className="text-xs font-mono text-slate-400">
                              Placa: {grupo.placa}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Viajes Realizados */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
                          {grupo.total_viajes} {grupo.total_viajes === 1 ? "viaje" : "viajes"}
                        </span>
                      </td>

                      {/* Ingreso Total */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-base text-emerald-400">
                          {formatCurrency(grupo.ingreso_total)}
                        </span>
                      </td>

                      {/* Acción: Ver el ingreso detallado (Ojo) */}
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedGroup(grupo)}
                          title="Ver el ingreso detallado"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white transition-all shadow-sm shadow-indigo-500/10 hover:scale-105"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
              <span className="text-xs text-slate-400">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: VER INGRESO DETALLADO */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedGroup(null);
          }}
        >
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="border-b border-white/10 bg-white/[0.02] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Detalle de Ingresos del Chofer
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span>
                      Operador: <strong className="text-indigo-300">{selectedGroup.operador}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Unidad: <strong className="text-white">{selectedGroup.numero_unidad}</strong> ({selectedGroup.placa})
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedGroup(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resumen del Grupo en el Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-6 pb-2 border-b border-white/5 bg-black/20">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Ingreso Acumulado</p>
                <p className="text-lg font-mono font-bold text-emerald-400">
                  {formatCurrency(selectedGroup.ingreso_total)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Total de Registros</p>
                <p className="text-lg font-mono font-bold text-white">
                  {selectedGroup.total_viajes} {selectedGroup.total_viajes === 1 ? "registro" : "registros"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400">Promedio por Viaje</p>
                <p className="text-lg font-mono font-bold text-blue-300">
                  {formatCurrency(
                    selectedGroup.total_viajes > 0
                      ? selectedGroup.ingreso_total / selectedGroup.total_viajes
                      : 0
                  )}
                </p>
              </div>
            </div>

            {/* Tabla Detallada con scroll */}
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400 sticky top-0 bg-slate-900">
                  <tr>
                    <th className="px-4 py-3">Operador</th>
                    <th className="px-4 py-3">Número de Unidad</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Ingreso</th>
                    <th className="px-4 py-3">Concepto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedGroup.detalles.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Operador */}
                      <td className="px-4 py-3 font-medium text-white">
                        {item.operador}
                      </td>

                      {/* Número de Unidad */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-200">
                          {item.numero_unidad}
                        </span>
                        <span className="ml-1.5 text-xs text-slate-400 font-mono">
                          ({item.placa})
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(item.fecha)}</span>
                        </div>
                      </td>

                      {/* Ingreso */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.ingreso)}
                      </td>

                      {/* Concepto / Comprobante */}
                      <td className="px-4 py-3 text-xs text-slate-400">
                        <div>
                          <span>{item.concepto || "Sin concepto"}</span>
                          {item.comprobante && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-white/10">
                              <Receipt className="h-3 w-3" />
                              {item.comprobante}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer del Modal */}
            <div className="border-t border-white/10 bg-white/[0.02] px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Mostrando {selectedGroup.detalles.length} registros individuales
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
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
