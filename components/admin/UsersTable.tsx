"use client";

// ============================================================
// COMPONENTE: Tabla de Usuarios — Panel de Administración
// components/admin/UsersTable.tsx
// ============================================================

import { useState, useTransition } from "react";
import {
  toggleHabilitadoAction,
  actualizarMaxUnidadesAction,
} from "@/app/actions/admin";
import type { AdminUsuario } from "@/lib/types";
import {
  Users,
  CheckCircle,
  XCircle,
  Car,
  Edit3,
  Check,
  X,
  Shield,
  User,
  Loader2,
} from "lucide-react";

interface UsersTableProps {
  usuarios: AdminUsuario[];
}

export function UsersTable({ usuarios: initialUsuarios }: UsersTableProps) {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>(initialUsuarios);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [, startTransition] = useTransition();

  function showMensaje(tipo: "ok" | "error", texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  }

  // -------------------------------------------------------
  // Toggle habilitar/deshabilitar
  // -------------------------------------------------------
  function handleToggle(usuario: AdminUsuario) {
    if (loadingId) return;
    const nuevoEstado = !usuario.habilitado;
    setLoadingId(usuario.id);

    startTransition(async () => {
      const result = await toggleHabilitadoAction(usuario.id, nuevoEstado);
      if (result.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuario.id ? { ...u, habilitado: nuevoEstado } : u
          )
        );
        showMensaje(
          "ok",
          `Usuario ${nuevoEstado ? "habilitado" : "deshabilitado"} correctamente.`
        );
      } else {
        showMensaje("error", result.error ?? "Error desconocido.");
      }
      setLoadingId(null);
    });
  }

  // -------------------------------------------------------
  // Guardar límite de unidades
  // -------------------------------------------------------
  function handleEditStart(usuario: AdminUsuario) {
    setEditingId(usuario.id);
    setEditValue(String(usuario.max_unidades));
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditValue("");
  }

  function handleEditSave(usuarioId: string) {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0 || val > 9999) {
      showMensaje("error", "El límite debe ser un número entre 0 y 9999.");
      return;
    }
    setLoadingId(usuarioId);
    setEditingId(null);

    startTransition(async () => {
      const result = await actualizarMaxUnidadesAction(usuarioId, val);
      if (result.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioId ? { ...u, max_unidades: val } : u
          )
        );
        showMensaje("ok", "Límite de unidades actualizado.");
      } else {
        showMensaje("error", result.error ?? "Error desconocido.");
      }
      setLoadingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Notificación flotante */}
      {mensaje && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl transition-all duration-300 ${
            mensaje.tipo === "ok"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
              : "bg-red-500/20 border border-red-500/40 text-red-300"
          }`}
        >
          {mensaje.tipo === "ok" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {mensaje.texto}
        </div>
      )}

      {/* Contador de usuarios */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Users className="h-4 w-4" />
          <span>
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">
            {usuarios.filter((u) => u.habilitado).length} habilitado{usuarios.filter((u) => u.habilitado).length !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400">
            {usuarios.filter((u) => !u.habilitado).length} pendiente{usuarios.filter((u) => !u.habilitado).length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Usuario
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Rol
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Estado
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Unidades
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Límite Máx.
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    No hay usuarios registrados aún.
                  </td>
                </tr>
              )}
              {usuarios.map((usuario) => {
                const isLoading = loadingId === usuario.id;
                const isEditing = editingId === usuario.id;

                return (
                  <tr
                    key={usuario.id}
                    className="group hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    {/* Email */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
                          <span className="text-xs font-bold text-violet-300">
                            {usuario.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
                            {usuario.email}
                          </p>
                          <p className="text-xs text-slate-600">
                            {usuario.created_at
                              ? new Date(usuario.created_at).toLocaleDateString("es-PE")
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-5 py-4">
                      {usuario.rol === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-white/10">
                          <User className="h-3 w-3" />
                          Usuario
                        </span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4 text-center">
                      {usuario.habilitado ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                          <CheckCircle className="h-3 w-3" />
                          Habilitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                          <XCircle className="h-3 w-3" />
                          Pendiente
                        </span>
                      )}
                    </td>

                    {/* Unidades actuales */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                        <Car className="h-3.5 w-3.5 text-slate-500" />
                        {usuario.total_unidades ?? 0}
                      </span>
                    </td>

                    {/* Límite editable */}
                    <td className="px-5 py-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            id={`limite-input-${usuario.id}`}
                            type="number"
                            min={0}
                            max={9999}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(usuario.id);
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            autoFocus
                            className="w-20 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-center text-sm text-violet-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                          />
                          <button
                            id={`btn-guardar-${usuario.id}`}
                            onClick={() => handleEditSave(usuario.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            title="Guardar"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-cancelar-${usuario.id}`}
                            onClick={handleEditCancel}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-mono text-slate-300">
                          {usuario.max_unidades}
                          <button
                            id={`btn-editar-limite-${usuario.id}`}
                            onClick={() => handleEditStart(usuario)}
                            disabled={isLoading}
                            className="ml-1 text-slate-600 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Editar límite"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                    </td>

                    {/* Toggle habilitar */}
                    <td className="px-5 py-4 text-center">
                      {usuario.rol === "admin" ? (
                        <span className="text-xs text-slate-600">—</span>
                      ) : isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-slate-500 mx-auto" />
                      ) : (
                        <button
                          id={`btn-toggle-${usuario.id}`}
                          onClick={() => handleToggle(usuario)}
                          disabled={!!loadingId}
                          className={`
                            inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-semibold
                            transition-all duration-200 ring-1
                            ${usuario.habilitado
                              ? "bg-red-500/10 text-red-400 ring-red-500/30 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30 hover:bg-emerald-500/20"
                            }
                            disabled:opacity-40 disabled:cursor-not-allowed
                          `}
                        >
                          {usuario.habilitado ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Deshabilitar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Habilitar
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
