-- ============================================================
-- SCRIPT SQL — Agregar columna "abono"
-- Tabla: registros_mantenimiento
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar la columna abono si no existe (con valor por defecto 0)
ALTER TABLE registros_mantenimiento
  ADD COLUMN IF NOT EXISTS abono NUMERIC(12, 2) DEFAULT 0;

-- 2. Comentario descriptivo para la columna
COMMENT ON COLUMN registros_mantenimiento.abono IS 
  'Monto abonado / adelantado en dólares ($) para el mantenimiento. El saldo pendiente se calcula como (costo_total - abono).';

-- 3. Asegurarse de que los registros existentes no tengan valor NULL
UPDATE registros_mantenimiento
  SET abono = 0
  WHERE abono IS NULL;

-- 4. Verificación de la columna creada
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'registros_mantenimiento'
  AND column_name = 'abono';
