-- ==============================================================================
-- MIGRACIÓN: Vincular Otros Egresos a cada Unidad específica
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ==============================================================================

-- 1. Agregar la columna unidad_id a la tabla otros_egresos si aún no existe
ALTER TABLE public.otros_egresos 
ADD COLUMN IF NOT EXISTS unidad_id INTEGER REFERENCES public.unidades(id) ON DELETE CASCADE;

-- 2. Si ya existen registros previos sin unidad_id, asignarles la primera unidad del usuario
UPDATE public.otros_egresos oe
SET unidad_id = (
  SELECT u.id 
  FROM public.unidades u 
  WHERE u.user_id = oe.user_id 
  ORDER BY u.id ASC 
  LIMIT 1
)
WHERE oe.unidad_id IS NULL;

-- 3. Crear índice para optimizar consultas por unidad
CREATE INDEX IF NOT EXISTS idx_otros_egresos_user_unidad 
ON public.otros_egresos (user_id, unidad_id);

