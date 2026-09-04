// ============================================================
// COMPONENTE: FinancialSummaryCard
// components/dashboard/FinancialSummaryCard.tsx
// Tarjeta reutilizable para métricas financieras del dashboard
// ============================================================

import { type LucideIcon } from "lucide-react";

interface FinancialSummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  /** Paleta de colores: income | expense | maintenance | labor | profit */
  variant: "income" | "expense" | "maintenance" | "labor" | "profit";
  subtitle?: string;
  currency?: "USD" | "BS" | "PEN";
  badgeText?: string;
  secondaryAmount?: {
    label: string;
    amount: number;
    currency: "USD" | "BS";
  };
}

const variantConfig = {
  income: {
    gradient: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    amountColor: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
    badgeText: "Ingresos",
  },
  expense: {
    gradient: "from-red-500/20 to-red-600/10",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    amountColor: "text-red-400",
    badge: "bg-red-500/20 text-red-300",
    badgeText: "Gastos",
  },
  maintenance: {
    gradient: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    amountColor: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
    badgeText: "Servicio",
  },
  labor: {
    gradient: "from-orange-500/20 to-orange-600/10",
    border: "border-orange-500/30",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
    amountColor: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-300",
    badgeText: "Mano Obra",
  },
  profit: {
    gradient: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/30",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    amountColor: "text-violet-400",
    badge: "bg-violet-500/20 text-violet-300",
    badgeText: "Neto",
  },
};

function formatAmount(amount: number, currency: "USD" | "BS" | "PEN" = "USD"): string {
  const isNeg = amount < 0;
  const absVal = Math.abs(amount);
  const prefix = isNeg ? "- " : "";

  if (currency === "BS") {
    return (
      prefix +
      "Bs. " +
      absVal.toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  if (currency === "PEN") {
    return (
      prefix +
      new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2,
      }).format(absVal)
    );
  }
  return (
    prefix +
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(absVal)
  );
}

export function FinancialSummaryCard({
  title,
  amount,
  icon: Icon,
  variant,
  subtitle,
  currency = "USD",
  badgeText,
  secondaryAmount,
}: FinancialSummaryCardProps) {
  const config = variantConfig[variant];
  const isNegative = amount < 0;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5
        backdrop-blur-sm transition-all duration-300
        hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
        ${config.gradient} ${isNegative ? "border-red-500/40" : config.border}
      `}
    >
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />

      <div className="relative flex items-start justify-between gap-3">
        {/* Ícono */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isNegative ? "bg-red-500/20" : config.iconBg
          }`}
        >
          <Icon className={`h-5 w-5 ${isNegative ? "text-red-400" : config.iconColor}`} strokeWidth={1.5} />
        </div>

        {/* Badge tipo */}
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isNegative ? "bg-red-500/20 text-red-300" : config.badge
          }`}
        >
          {badgeText || config.badgeText}
        </span>
      </div>

      {/* Contenido */}
      <div className="relative mt-3">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <p
          className={`mt-1 font-mono font-bold tracking-tight text-xl sm:text-2xl ${
            isNegative
              ? "text-red-400"
              : variant === "profit"
              ? "text-emerald-400"
              : config.amountColor
          }`}
        >
          {formatAmount(amount, currency)}
        </p>

        {secondaryAmount && (
          <p
            className={`mt-0.5 font-mono font-bold tracking-tight text-xl sm:text-2xl ${
              secondaryAmount.amount < 0
                ? "text-red-400"
                : variant === "profit"
                ? "text-cyan-300"
                : "text-slate-200"
            }`}
          >
            {secondaryAmount.amount > 0 && variant === "profit" ? "+ " : ""}
            {formatAmount(secondaryAmount.amount, secondaryAmount.currency)}
          </p>
        )}

        {subtitle && (
          <p className="mt-1 text-[11px] text-slate-500 leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
