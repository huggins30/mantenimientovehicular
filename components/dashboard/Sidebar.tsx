"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Droplets,
  Package,
  TrendingUp,
  Car,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeUnidadId: number;
}

export function Sidebar({ activeUnidadId }: SidebarProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "resumen";
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: "resumen",
      label: "Resumen Financiero",
      icon: LayoutDashboard,
      description: "Rentabilidad y métricas",
    },
    {
      id: "aceite",
      label: "Control de Aceite",
      icon: Droplets,
      description: "Semáforo y kilometraje",
    },
    {
      id: "ingresos",
      label: "Ingresos Diarios",
      icon: TrendingUp,
      description: "Registro de fletes y viajes",
    },
    {
      id: "repuestos",
      label: "Piezas y Repuestos",
      icon: Package,
      description: "Historial de gastos",
    },
  ];

  return (
    <>
      {/* Botón Mobile para abrir sidebar */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-500/30"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-black/35 backdrop-blur-xl transition-transform duration-300 ease-in-out md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/30 ring-1 ring-violet-500/40">
                <Car className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight leading-none">
                  Gestión
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Vehicular</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <Link
                  key={item.id}
                  href={`/?unidad=${activeUnidadId}&tab=${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200
                    ${
                      isActive
                        ? "bg-violet-500/15 ring-1 ring-violet-500/30"
                        : "hover:bg-white/5"
                    }
                  `}
                >
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                          : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-violet-300 font-bold" : "text-slate-300"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <p className="text-center text-xs text-slate-600">
              MantenimientoVehicular © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
