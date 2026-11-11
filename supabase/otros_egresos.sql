-- ============================================================
-- TABLA: otros_egresos
-- Módulo de egresos/gastos adicionales no asociados a repuestos o aceite
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.otros_egresos (
  id              SERIAL PRIMARY KEY,
  user_id         UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidad_id       INTEGER        NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  concepto        VARCHAR(300)   NOT NULL,
  tipo_moneda     VARCHAR(5)     NOT NULL DEFAULT 'USD'
                    CHECK (tipo_moneda IN ('USD', 'BS')),
  monto_usd       NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (monto_usd >= 0),
  monto_bs        NUMERIC(14,2)  NOT NULL DEFAULT 0 CHECK (monto_bs >= 0),
  fecha           DATE           NOT NULL DEFAULT CURRENT_DATE,
  notas           TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) — aislamiento por usuario
ALTER TABLE public.otros_egresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus otros_egresos"
  ON public.otros_egresos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para consultas rápidas por usuario, unidad y fecha
CREATE INDEX IF NOT EXISTS idx_otros_egresos_user_fecha
  ON public.otros_egresos (user_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_otros_egresos_user_unidad
  ON public.otros_egresos (user_id, unidad_id);

