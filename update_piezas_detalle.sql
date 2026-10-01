-- ============================================================
-- SCRIPT SQL — Agregar columna "piezas_detalle" (JSONB)
-- Tabla: registros_mantenimiento
-- Ejecutar en: Supabase Dashboard → SQL Editor (Opcional)
-- ============================================================

-- 1. Agregar la columna piezas_detalle para almacenar el desglose de cada gasto
ALTER TABLE registros_mantenimiento
  ADD COLUMN IF NOT EXISTS piezas_detalle JSONB DEFAULT '[]'::jsonb;

-- 2. Comentario descriptivo para la columna
COMMENT ON COLUMN registros_mantenimiento.piezas_detalle IS 
  'Desglose estructurado en formato JSON de cada pieza/repuesto con concepto, cantidad, costo unitario, subtotal y precio directo en bolívares.';

-- 3. Verificación de la columna creada
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'registros_mantenimiento'
  AND column_name = 'piezas_detalle';
