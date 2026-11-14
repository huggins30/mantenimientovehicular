-- ============================================================
-- Migración: Agregar campo "financiado" a otros_egresos y registros_mantenimiento
-- y crear tabla de pagos de financiamiento
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Campo financiado en otros_egresos
ALTER TABLE otros_egresos
  ADD COLUMN IF NOT EXISTS financiado BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Campo financiado en registros_mantenimiento
ALTER TABLE registros_mantenimiento
  ADD COLUMN IF NOT EXISTS financiado BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Tabla de pagos de financiamiento
CREATE TABLE IF NOT EXISTS pagos_financiamiento (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Referencia al egreso financiado (uno de los dos campos tendrá valor)
  otro_egreso_id        BIGINT REFERENCES otros_egresos(id) ON DELETE CASCADE,
  registro_mantenimiento_id BIGINT REFERENCES registros_mantenimiento(id) ON DELETE CASCADE,
  -- Monto del pago
  tipo_moneda     TEXT NOT NULL CHECK (tipo_moneda IN ('USD', 'BS')),
  monto_usd       NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_bs        NUMERIC(14,2) NOT NULL DEFAULT 0,
  fecha           DATE NOT NULL,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pagos_financiamiento_one_ref CHECK (
    (otro_egreso_id IS NOT NULL)::int + (registro_mantenimiento_id IS NOT NULL)::int = 1
  )
);

-- RLS para pagos_financiamiento
ALTER TABLE pagos_financiamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios pagos"
  ON pagos_financiamiento FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus propios pagos"
  ON pagos_financiamiento FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios eliminan sus propios pagos"
  ON pagos_financiamiento FOR DELETE
  USING (auth.uid() = user_id);

