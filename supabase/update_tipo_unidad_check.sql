-- ==============================================================================
-- MIGRACIÓN: Permitir tipo de unidad 'Otra' y 'Otros' en la tabla unidades
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ==============================================================================

-- 1. Eliminar la restricción actual si existe
ALTER TABLE public.unidades 
DROP CONSTRAINT IF EXISTS unidades_tipo_unidad_check;

-- 2. Volver a crear la restricción incluyendo 'Otra' y 'Otros'
ALTER TABLE public.unidades 
ADD CONSTRAINT unidades_tipo_unidad_check 
CHECK (tipo_unidad IN ('Unidad Comun', 'Fraternidad', 'Otra', 'Otros'));

