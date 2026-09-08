-- ============================================================
-- SCRIPT SQL — Agregar columnas "Precio en Bs Directo"
-- Tabla: registros_mantenimiento
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar las nuevas columnas (con IF NOT EXISTS para seguridad)
ALTER TABLE registros_mantenimiento
  ADD COLUMN IF NOT EXISTS precio_bs_repuestos NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_bs_mano_obra NUMERIC(14,2) DEFAULT 0;

-- 2. Comentarios descriptivos de las columnas
COMMENT ON COLUMN registros_mantenimiento.precio_bs_repuestos IS 
  'Precio en Bolívares de piezas/repuesto ingresado directamente por el usuario. 
   NO se convierte ni influye en el cálculo del costo en Dólares (costo_total).';

COMMENT ON COLUMN registros_mantenimiento.precio_bs_mano_obra IS 
  'Precio en Bolívares de mano de obra ingresado directamente por el usuario.
   NO se convierte ni influye en el cálculo del costo en Dólares (costo_total).';

-- 3. Asegurarse de que los registros existentes tengan valor 0 (no NULL)
UPDATE registros_mantenimiento
  SET 
    precio_bs_repuestos = COALESCE(precio_bs_repuestos, 0),
    precio_bs_mano_obra = COALESCE(precio_bs_mano_obra, 0)
  WHERE precio_bs_repuestos IS NULL 
     OR precio_bs_mano_obra IS NULL;

-- 4. Verificar la estructura de la tabla actualizada
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'registros_mantenimiento'
  AND column_name IN (
    'precio_bs_repuestos',
    'precio_bs_mano_obra',
    'costo_total',
    'costo_bolivares',
    'tasa_cambio'
  )
ORDER BY ordinal_position;
