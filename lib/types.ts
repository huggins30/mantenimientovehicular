// ============================================================
// TIPOS E INTERFACES DEL SISTEMA DE MANTENIMIENTO VEHICULAR
// ============================================================

// -------------------------------------------------------
// Tabla: unidades
// Representa cada vehículo/unidad de transporte registrado
// -------------------------------------------------------
export interface Unidad {
  id: number;
  user_id: string; // UUID del usuario propietario
  numero_unidad: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje_actual: number;
  estado: "activo" | "inactivo" | "mantenimiento";
  tipo_unidad?: "Unidad Comun" | "Fraternidad" | string;
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: mantenimientos_aceite
// Historial de cambios de aceite por unidad
// -------------------------------------------------------
export interface MantenimientoAceite {
  id: number;
  user_id: string;
  unidad_id: number;
  tipo_aceite: string;
  kilometraje_servicio: number;
  /** Calculado automáticamente: kilometraje_servicio + 5000 */
  proximo_kilometraje: number;
  fecha_servicio: string; // ISO date string
  costo_servicio: number;
  notas?: string;
  created_at?: string;
}

// DTO para crear un nuevo mantenimiento
export type NuevoMantenimientoAceite = Omit<
  MantenimientoAceite,
  "id" | "created_at" | "proximo_kilometraje" | "user_id"
>;

// -------------------------------------------------------
// Tabla: gastos_repuestos
// Registro de gastos en repuestos por unidad
// -------------------------------------------------------
export interface GastoRepuesto {
  id: number;
  user_id: string;
  unidad_id: number;
  concepto: string;
  cantidad: number;
  costo_unitario: number;
  /** Calculado por la DB: cantidad * costo_unitario */
  monto_total: number;
  fecha_compra: string; // ISO date string
  proveedor?: string;
  notas?: string;
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: gastos_mano_obra
// Registro de gastos por mano de obra por unidad
// -------------------------------------------------------
export interface GastoManoObra {
  id: number;
  user_id: string;
  unidad_id: number;
  concepto: string;
  costo: number;
  fecha: string; // ISO date string
  notas?: string;
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: registros_mantenimiento
// Registro unificado de repuesto + mano de obra
// -------------------------------------------------------
export interface RegistroMantenimiento {
  id: number;
  user_id: string;
  unidad_id: number;
  fecha: string; // ISO date string
  // Pieza / Repuesto
  rep_concepto: string;
  rep_cantidad: number;
  rep_costo_unitario: number;
  rep_subtotal: number; // calculado por DB
  // Mano de obra
  mo_concepto: string;
  mo_costo: number;
  // Total calculado por DB: rep_subtotal + mo_costo
  costo_total: number;
  costo_bolivares?: number;
  tasa_cambio?: number;
  proveedor?: string;
  notas?: string;
  created_at?: string;
  /** Precio en Bs de piezas/repuesto ingresado directamente (NO se convierte a USD) */
  precio_bs_repuestos?: number;
  /** Precio en Bs de mano de obra ingresado directamente (NO se convierte a USD) */
  precio_bs_mano_obra?: number;
  /** Abono / adelanto recibido para este mantenimiento (en USD). Saldo = costo_total - abono */
  abono?: number;
}

// -------------------------------------------------------
// Tabla: ingresos_unidad
// Registro de ingresos (fletes, pasajes, etc.)
// -------------------------------------------------------
export interface IngresoUnidad {
  id: number;
  user_id: string;
  unidad_id: number;
  concepto: string;
  monto_ingreso: number;
  fecha: string; // ISO date string
  comprobante?: string;
  // Formas de pago
  pago_movil: number;
  movi?: number;
  dolares: number;
  monto_bs_dolar?: number;
  efectivo: number;
  otros: number;
  gastos?: number;
  // Calculados
  ahorro_unidad?: number;
  colector?: number;
  nombre_operador?: string;
  nombre_colector?: string;
  kilometraje_actual?: number;
  tipo?: "Traslado" | "Ruta" | string;
  tipo_tabla?: "comun" | "fraternidad";
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: ingresos_diarios_f
// Registro de ingresos para unidades Fraternidad
// -------------------------------------------------------
export interface IngresoUnidadF {
  id: number;
  user_id: string;
  unidad_id: number;
  concepto: string;
  monto_ingreso: number;
  fecha: string;
  comprobante?: string;
  kilometraje_actual?: number;
  nombre_operador?: string;
  pago_movil: number;
  dolares: number;
  monto_bs_dolar: number;
  efectivo: number;
  otros: number;
  gastos: number;
  ahorro_unidad?: number;
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: compras_dolares
// Registro de compras de divisas (dólares) por unidad
// -------------------------------------------------------
export interface ComprasDolares {
  id: number;
  user_id: string;
  unidad_id: number;
  fecha: string;            // ISO date string
  cantidad_dolares: number; // Monto en USD
  tasa_cambio: number;      // Tasa Bs/USD del momento
  costo_bolivares: number;  // Calculado: cantidad_dolares * tasa_cambio
  notas?: string;
  created_at?: string;
  unidades?: {
    placa: string;
    numero_unidad: string | null;
    marca?: string;
    modelo?: string;
  } | null;
}

// -------------------------------------------------------
// TIPOS AUXILIARES / DOMINIO DE NEGOCIO
// -------------------------------------------------------

/**
 * Estado del semáforo de cambio de aceite:
 * - green:  Restan más de 1,000 km para el próximo servicio
 * - yellow: Restan entre 1 y 1,000 km
 * - red:    Kilometraje actual >= próximo kilometraje (servicio vencido)
 */
export type OilChangeStatus = "green" | "yellow" | "red";

/** Datos calculados del semáforo de aceite */
export interface OilChangeStatusData {
  status: OilChangeStatus;
  kmRestantes: number;
  proximoKilometraje: number;
  ultimoServicio: MantenimientoAceite | null;
}

/** Resumen financiero consolidado del dashboard */
export interface FinancialSummary {
  totalIngresos: number;
  totalIngresosDolares: number;
  totalIngresosBolivares: number;
  /** Ingresos en Bolívares antes de restar gastos directos en Bs */
  totalIngresosBolivaresBruto?: number;
  totalGastosRepuestos: number;
  totalGastosRepuestosBs?: number;
  totalMantenimientoAceite: number;
  totalMantenimientoAceiteBs?: number;
  totalManoObra: number;
  /** Rentabilidad en Dólares ($) = Ingresos USD - Gastos USD */
  rentabilidadDolares: number;
  /** Rentabilidad en Bolívares (Bs) = Ingresos Bs - Gastos Bs (conversión) */
  rentabilidadBolivares: number;
  /** Rentabilidad en USD */
  rentabilidadNeta: number;
  /** Total acumulado de compras de divisas (USD) */
  totalDolaresComprados?: number;
  /** Total de bolívares usados para comprar divisas */
  totalBsUsadosCompras?: number;
  /** Total de gastos en Bolívares directos (precio_bs_repuestos + precio_bs_mano_obra, NO convertidos a USD) */
  totalGastosBsDirecto?: number;
  /** Rentabilidad en Bs = Ingresos Bs - Gastos Bs directos */
  rentabilidadBsDirecta?: number;
  /** Total de saldos pendientes por pagar ($) = Solo mantenimientos y repuestos con abono registrado (abono > 0 y costo_total > abono) */
  totalSaldoPendiente?: number;
}

/** Datos completos que carga el dashboard */
export interface DashboardData {
  unidad: Unidad;
  financialSummary: FinancialSummary;
  oilChangeStatus: OilChangeStatusData;
  ultimosMantenimientos: MantenimientoAceite[];
  ultimosGastos: GastoRepuesto[];
  ultimosGastosManoObra: GastoManoObra[];
  ultimosIngresos: IngresoUnidad[];
  ultimosRegistrosMantenimiento: RegistroMantenimiento[];
}

/** Resultado genérico de un Server Action */
export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

// -------------------------------------------------------
// Tabla: perfiles
// Extiende auth.users con rol, habilitado y límite de unidades
// -------------------------------------------------------
export interface Perfil {
  id: string; // UUID, referencia a auth.users(id)
  email: string;
  rol: "admin" | "usuario";
  habilitado: boolean;
  max_unidades: number;
  created_at?: string;
}

/** Vista extendida para el panel de admin: perfil + conteo de unidades */
export interface AdminUsuario extends Perfil {
  total_unidades?: number;
}

// -------------------------------------------------------
// Rendimiento de Operadores (Choferes)
// -------------------------------------------------------
export interface ChoferIngresoDetalle {
  id: number;
  unidad_id: number;
  numero_unidad: string;
  placa: string;
  operador: string;
  ingreso: number;
  fecha: string;
  concepto?: string;
  comprobante?: string;
}

export interface ChoferPerformanceGroup {
  operador: string;
  unidad_id: number;
  numero_unidad: string;
  placa: string;
  ingreso_total: number;
  total_viajes: number;
  detalles: ChoferIngresoDetalle[];
}

