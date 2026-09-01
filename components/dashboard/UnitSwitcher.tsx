"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Unidad } from "@/lib/types";

interface UnitSwitcherProps {
  unidades: Unidad[];
  activeUnidadId: number;
  canAddUnit?: boolean;
}

export function UnitSwitcher({ unidades, activeUnidadId, canAddUnit = false }: UnitSwitcherProps) {
  const router = useRouter();
  
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 max-w-full custom-scrollbar">
      {unidades.map((u) => {
        const isActive = u.id === activeUnidadId;
        return (
          <button
            key={u.id}
            onClick={() => {
              if (!isActive) router.push(`/?unidad=${u.id}`);
            }}
            className={`
              flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all
              ${isActive 
                ? "bg-violet-500/20 border border-violet-500/50 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            <div className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            Unidad {u.numero_unidad || u.placa} — {u.marca} {u.modelo}
          </button>
        );
      })}

      {canAddUnit && (
        <button
          onClick={() => router.push("/?tab=nueva-unidad")}
          className="
            flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all 
            border border-dashed border-white/20 bg-white/5 text-slate-400 
            hover:bg-white/10 hover:text-white hover:border-white/30
          "
        >
          <Plus className="h-4 w-4" />
          Añadir Unidad
        </button>
      )}
    </div>
  );
}
