"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Unidad } from "@/lib/types";

interface UnitSwitcherProps {
  unidades: Unidad[];
  activeUnidadId: number;
}

export function UnitSwitcher({ unidades, activeUnidadId }: UnitSwitcherProps) {
  const router = useRouter();
  
  if (unidades.length <= 1) {
    return null; // Si solo hay una unidad, no mostramos selector
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="unit-switcher" className="text-xs font-medium text-slate-400">
        Unidad:
      </label>
      <select
        id="unit-switcher"
        value={activeUnidadId}
        onChange={(e) => {
          const newId = e.target.value;
          router.push(`/?unidad=${newId}`);
        }}
        className="
          rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 
          text-sm font-medium text-white outline-none 
          transition-all focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30
        "
      >
        {unidades.map((u) => (
          <option key={u.id} value={u.id} className="bg-slate-900 text-white">
            {u.placa} — {u.marca} {u.modelo}
          </option>
        ))}
      </select>
    </div>
  );
}
