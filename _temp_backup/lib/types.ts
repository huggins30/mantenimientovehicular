// ============================================================
// TIPOS E INTERFACES DEL SISTEMA DE MANTENIMIENTO VEHICULAR
// ============================================================

// -------------------------------------------------------
// Tabla: unidades
// Representa cada vehículo/unidad de transporte registrado
// -------------------------------------------------------
export interface Unidad {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje_actual: number;
  estado: "activo" | "inactivo" | "mantenimiento";
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: mantenimientos_aceite
// Historial de cambios de aceite por unidad
// -------------------------------------------------------
export interface MantenimientoAceite {
  id: number;
  unidad_id: number;
  tipo_aceite: string;
  kilometraje_servicio: number;
  /** Calculado automáticamente: kilometraje_servicio + 5000 */
  proximo_kilometraje: number;
  fecha_servicio: string; // ISO date string
  costo_servicio: number;
  created_at?: string;
}

// DTO para crear un nuevo mantenimiento
export type NuevoMantenimientoAceite = Omit<
  MantenimientoAceite,
  "id" | "created_at" | "proximo_kilometraje"
>;

// -------------------------------------------------------
// Tabla: gastos_repuestos
// Registro de gastos en repuestos por unidad
// -------------------------------------------------------
export interface GastoRepuesto {
  id: number;
  unidad_id: number;
  concepto: string;
  cantidad: number;
  costo_unitario: number;
  /** Calculado: cantidad * costo_unitario */
  monto_total: number;
  fecha_compra: string; // ISO date string
  created_at?: string;
}

// -------------------------------------------------------
// Tabla: ingresos_unidad
// Registro de ingresos (fletes, pasajes, etc.)
// -------------------------------------------------------
export interface IngresoUnidad {
  id: number;
  unidad_id: number;
  concepto: string;
  monto_ingreso: number;
  fecha: string; // ISO date string
  comprobante?: string;
  created_at?: string;
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
  totalGastosRepuestos: number;
  totalMantenimientoAceite: number;
  /** Fórmula: totalIngresos - (totalGastosRepuestos + totalMantenimientoAceite) */
  rentabilidadNeta: number;
}

/** Datos completos que carga el dashboard */
export interface DashboardData {
  unidad: Unidad;
  financialSummary: FinancialSummary;
  oilChangeStatus: OilChangeStatusData;
  ultimosMantenimientos: MantenimientoAceite[];
  ultimosGastos: GastoRepuesto[];
  ultimosIngresos: IngresoUnidad[];
}

/** Resultado genérico de un Server Action */
export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}
