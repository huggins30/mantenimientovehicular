"use client";

// ============================================================
// COMPONENTE: LoginForm — Login / Registro
// components/auth/LoginForm.tsx
// ============================================================

import { useActionState, useState } from "react";
import { signInAction, signUpAction } from "@/app/actions/auth";
import type { ActionResult } from "@/lib/types";
import {
  Mail,
  Lock,
  Car,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const initialState: ActionResult = { success: false };

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  const [loginState, loginAction, loginPending] = useActionState(
    signInAction,
    initialState
  );
  const [registerState, registerAction, registerPending] = useActionState(
    signUpAction,
    initialState
  );

  const state = mode === "login" ? loginState : registerState;
  const action = mode === "login" ? loginAction : registerAction;
  const isPending = mode === "login" ? loginPending : registerPending;

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow decorativo */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/30 ring-1 ring-violet-400/30">
            <Car className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">MantenimientoVehicular</h1>
            <p className="text-sm text-slate-400 mt-0.5">Sistema de gestión vehicular</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Mensaje de registro exitoso */}
        {mode === "register" && registerState.success && (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-300">¡Registro exitoso!</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Tu cuenta está pendiente de aprobación por el administrador.
              </p>
            </div>
          </div>
        )}

        {/* Error feedback */}
        {state.error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{state.error}</p>
          </div>
        )}

        {/* Formulario */}
        <form action={action} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                  outline-none transition-all duration-200
                  focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                  hover:border-white/20
                "
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Contraseña <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                required
                minLength={mode === "register" ? 6 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="
                  w-full rounded-xl border border-white/10 bg-white/5
                  pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500
                  outline-none transition-all duration-200
                  focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                  hover:border-white/20
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña (solo en registro) */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-300">
                Confirmar contraseña <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="
                    w-full rounded-xl border border-white/10 bg-white/5
                    pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500
                    outline-none transition-all duration-200
                    focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40
                    hover:border-white/20
                  "
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="
              group mt-2 w-full flex items-center justify-center gap-2
              rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
              px-4 py-3 text-sm font-semibold text-white shadow-lg
              shadow-violet-500/25 transition-all duration-200
              hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40
              focus:outline-none focus:ring-2 focus:ring-violet-500/60
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Iniciar Sesión" : "Crear cuenta"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        MantenimientoVehicular © {new Date().getFullYear()} — Todos los derechos reservados
      </p>
    </div>
  );
}
