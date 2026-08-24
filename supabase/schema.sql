-- ============================================================
-- SCRIPT SQL — Sistema de Mantenimiento Vehicular
-- v2: user_id + Row Level Security (RLS)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PARTE 1: CREAR TABLAS (si no existen)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.unidades (
  id                  SERIAL PRIMARY KEY,
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placa               VARCHAR(10)  NOT NULL,
  marca               VARCHAR(50)  NOT NULL,
  modelo              VARCHAR(50)  NOT NULL,
  anio                INTEGER      NOT NULL CHECK (anio >= 1900),
  kilometraje_actual  INTEGER      NOT NULL DEFAULT 0 CHECK (kilometraje_actual >= 0),
  estado              VARCHAR(20)  NOT NULL DEFAULT 'activo'
                        CHECK (estado IN ('activo', 'inactivo', 'mantenimiento')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, placa)
);

CREATE TABLE IF NOT EXISTS public.mantenimientos_aceite (
  id                    SERIAL PRIMARY KEY,
  user_id               UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidad_id             INTEGER       NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo_aceite           VARCHAR(100)  NOT NULL,
  kilometraje_servicio  INTEGER       NOT NULL CHECK (kilometraje_servicio >= 0),
  proximo_kilometraje   INTEGER       NOT NULL CHECK (proximo_kilometraje > 0),
  fecha_servicio        DATE          NOT NULL,
  costo_servicio        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo_servicio >= 0),
  notas                 TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gastos_repuestos (
  id              SERIAL PRIMARY KEY,
  user_id         UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidad_id       INTEGER        NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  concepto        VARCHAR(200)   NOT NULL,
  cantidad        INTEGER        NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  costo_unitario  NUMERIC(10,2)  NOT NULL CHECK (costo_unitario >= 0),
  monto_total     NUMERIC(10,2)  GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  fecha_compra    DATE           NOT NULL,
  proveedor       VARCHAR(100),
  notas           TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ingresos_unidad (
  id            SERIAL PRIMARY KEY,
  user_id       UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidad_id     INTEGER        NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  concepto      VARCHAR(200)   NOT NULL,
  monto_ingreso NUMERIC(10,2)  NOT NULL CHECK (monto_ingreso > 0),
  fecha         DATE           NOT NULL,
  comprobante   VARCHAR(100),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARTE 2: MIGRACIÓN — Agregar columnas a tablas existentes
-- (idempotente — seguro ejecutar más de una vez)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='unidades' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.unidades ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='mantenimientos_aceite' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.mantenimientos_aceite ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='mantenimientos_aceite' AND column_name='notas'
  ) THEN
    ALTER TABLE public.mantenimientos_aceite ADD COLUMN notas TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gastos_repuestos' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.gastos_repuestos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gastos_repuestos' AND column_name='proveedor'
  ) THEN
    ALTER TABLE public.gastos_repuestos ADD COLUMN proveedor VARCHAR(100);
    ALTER TABLE public.gastos_repuestos ADD COLUMN notas TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ingresos_unidad' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.ingresos_unidad ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- PARTE 3: ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_unidades_user_id         ON public.unidades(user_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_user_id   ON public.mantenimientos_aceite(user_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_unidad_id ON public.mantenimientos_aceite(unidad_id);
CREATE INDEX IF NOT EXISTS idx_gastos_user_id           ON public.gastos_repuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_unidad_id         ON public.gastos_repuestos(unidad_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_user_id         ON public.ingresos_unidad(user_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_unidad_id       ON public.ingresos_unidad(unidad_id);

-- ============================================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.unidades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos_aceite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_repuestos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingresos_unidad       ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "unidades_select"       ON public.unidades;
DROP POLICY IF EXISTS "unidades_insert"       ON public.unidades;
DROP POLICY IF EXISTS "unidades_update"       ON public.unidades;
DROP POLICY IF EXISTS "unidades_delete"       ON public.unidades;
DROP POLICY IF EXISTS "mantenimientos_select" ON public.mantenimientos_aceite;
DROP POLICY IF EXISTS "mantenimientos_insert" ON public.mantenimientos_aceite;
DROP POLICY IF EXISTS "mantenimientos_update" ON public.mantenimientos_aceite;
DROP POLICY IF EXISTS "mantenimientos_delete" ON public.mantenimientos_aceite;
DROP POLICY IF EXISTS "gastos_select"         ON public.gastos_repuestos;
DROP POLICY IF EXISTS "gastos_insert"         ON public.gastos_repuestos;
DROP POLICY IF EXISTS "gastos_delete"         ON public.gastos_repuestos;
DROP POLICY IF EXISTS "ingresos_select"       ON public.ingresos_unidad;
DROP POLICY IF EXISTS "ingresos_insert"       ON public.ingresos_unidad;
DROP POLICY IF EXISTS "ingresos_delete"       ON public.ingresos_unidad;

-- Políticas: unidades
CREATE POLICY "unidades_select" ON public.unidades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "unidades_insert" ON public.unidades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unidades_update" ON public.unidades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "unidades_delete" ON public.unidades FOR DELETE USING (auth.uid() = user_id);

-- Políticas: mantenimientos_aceite
CREATE POLICY "mantenimientos_select" ON public.mantenimientos_aceite FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mantenimientos_insert" ON public.mantenimientos_aceite FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mantenimientos_update" ON public.mantenimientos_aceite FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mantenimientos_delete" ON public.mantenimientos_aceite FOR DELETE USING (auth.uid() = user_id);

-- Políticas: gastos_repuestos
CREATE POLICY "gastos_select" ON public.gastos_repuestos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gastos_insert" ON public.gastos_repuestos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gastos_delete" ON public.gastos_repuestos FOR DELETE USING (auth.uid() = user_id);

-- Políticas: ingresos_unidad
CREATE POLICY "ingresos_select" ON public.ingresos_unidad FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ingresos_insert" ON public.ingresos_unidad FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ingresos_delete" ON public.ingresos_unidad FOR DELETE USING (auth.uid() = user_id);


-- Habilitar extensión de UUID si se desea usar UUIDs (opcional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
