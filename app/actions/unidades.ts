"use server";

// ============================================================
// SERVER ACTIONS — Unidades & Cambios de Aceite
// app/actions/unidades.ts
// ============================================================

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import type { ActionResult, MantenimientoAceite, NuevoMantenimientoAceite, Unidad } from "@/lib/types";

/** Intervalo estándar de cambio de aceite en kilómetros */
const INTERVALO_ACEITE_KM = 5000;

// -------------------------------------------------------
// Registrar nueva Unidad
// -------------------------------------------------------
export async function crearUnidadAction(
  _prevState: ActionResult<Unidad>,
  formData: FormData
): Promise<ActionResult<Unidad>> {
  const numero_unidad = String(formData.get("numero_unidad") ?? "").trim();
  const placa = String(formData.get("placa") ?? "").trim().toUpperCase();
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const anio = Number(formData.get("anio"));
  const kilometraje = Number(formData.get("kilometraje_actual"));

  if (!numero_unidad || !placa || !marca || !modelo || isNaN(anio) || isNaN(kilometraje)) {
    return { success: false, error: "Todos los campos son requeridos y deben ser válidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  // Verificar límite de unidades del perfil
  const { data: perfil } = await supabaseAdmin
    .from("perfiles")
    .select("max_unidades")
    .eq("id", user.id)
    .single();

  if (perfil) {
    const { count: totalUnidades } = await supabaseAdmin
      .from("unidades")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (totalUnidades !== null && totalUnidades >= perfil.max_unidades) {
      return {
        success: false,
        error: `Has alcanzado el límite de ${perfil.max_unidades} unidad(es) permitida(s). Contacta al administrador para ampliar tu cuota.`,
      };
    }
  }

  const { data, error } = await supabase
    .from("unidades")
    .insert({
      user_id: user.id,
      numero_unidad,
      placa,
      marca,
      modelo,
      anio,
      kilometraje_actual: kilometraje,
      estado: "activo",
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { success: false, error: "Ya tienes registrada una unidad con esta placa." };
    }
    return { success: false, error: `Error al crear unidad: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: data as Unidad };
}

// -------------------------------------------------------
// Actualizar el kilometraje actual de una unidad
// -------------------------------------------------------
export async function actualizarKilometraje(
  unidadId: number,
  nuevoKilometraje: number
): Promise<ActionResult> {
  if (!nuevoKilometraje || nuevoKilometraje <= 0) {
    return { success: false, error: "El kilometraje debe ser un número positivo." };
  }

  const supabase = await createSupabaseServerClient();

  // Verificar autenticación
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  // Verificar que el nuevo km no sea menor al actual (no retrocede el odómetro)
  const { data: unidad } = await supabase
    .from("unidades")
    .select("kilometraje_actual")
    .eq("id", unidadId)
    .eq("user_id", user.id)
    .single();

  if (unidad && nuevoKilometraje < unidad.kilometraje_actual) {
    return {
      success: false,
      error: `El nuevo kilometraje (${nuevoKilometraje.toLocaleString()} km) no puede ser menor al actual (${unidad.kilometraje_actual.toLocaleString()} km).`,
    };
  }

  const { error } = await supabase
    .from("unidades")
    .update({ kilometraje_actual: nuevoKilometraje })
    .eq("id", unidadId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: `Error al actualizar kilometraje: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}

// -------------------------------------------------------
// Registrar un nuevo cambio de aceite
// Calcula automáticamente proximo_kilometraje = kilometraje_servicio + 5000
// -------------------------------------------------------
export async function registrarCambioAceite(
  data: NuevoMantenimientoAceite
): Promise<ActionResult<MantenimientoAceite>> {
  // Validaciones básicas
  if (!data.tipo_aceite?.trim()) {
    return { success: false, error: "El tipo de aceite es requerido." };
  }
  if (!data.kilometraje_servicio || data.kilometraje_servicio <= 0) {
    return { success: false, error: "El kilometraje del servicio es requerido." };
  }
  if (!data.costo_servicio || data.costo_servicio < 0) {
    return { success: false, error: "El costo del servicio no puede ser negativo." };
  }

  const supabase = await createSupabaseServerClient();

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  // Calcular próximo kilometraje automáticamente (regla de negocio estricta)
  const proximo_kilometraje = data.kilometraje_servicio + INTERVALO_ACEITE_KM;

  const nuevoRegistro = {
    user_id: user.id,
    unidad_id: data.unidad_id,
    tipo_aceite: data.tipo_aceite,
    kilometraje_servicio: data.kilometraje_servicio,
    proximo_kilometraje,
    fecha_servicio: data.fecha_servicio || new Date().toISOString().split("T")[0],
    costo_servicio: data.costo_servicio,
  };

  const { data: mantenimiento, error } = await supabase
    .from("mantenimientos_aceite")
    .insert(nuevoRegistro)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: `Error al registrar cambio de aceite: ${error.message}`,
    };
  }

  // Actualizar el kilometraje de la unidad al del servicio si es mayor
  await supabase
    .from("unidades")
    .update({ kilometraje_actual: data.kilometraje_servicio })
    .eq("id", data.unidad_id)
    .eq("user_id", user.id)
    .lt("kilometraje_actual", data.kilometraje_servicio);

  revalidatePath("/");
  return { success: true, data: mantenimiento as MantenimientoAceite };
}

// -------------------------------------------------------
// Server Action wrappers para formularios (acepta FormData)
// -------------------------------------------------------
export async function actualizarKilometrajeAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const unidadId = Number(formData.get("unidad_id"));
  const nuevoKilometraje = Number(formData.get("kilometraje"));

  if (isNaN(unidadId) || isNaN(nuevoKilometraje)) {
    return { success: false, error: "Datos inválidos en el formulario." };
  }

  return actualizarKilometraje(unidadId, nuevoKilometraje);
}

export async function registrarCambioAceiteAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult<MantenimientoAceite>> {
  const unidadId = Number(formData.get("unidad_id"));
  const tipoAceite = String(formData.get("tipo_aceite") ?? "").trim();
  const kilometrajeServicio = Number(formData.get("kilometraje_servicio"));
  const costoServicio = Number(formData.get("costo_servicio"));
  const fechaServicio = String(formData.get("fecha_servicio") ?? "");

  if (isNaN(unidadId)) {
    return { success: false, error: "ID de unidad inválido." };
  }

  return registrarCambioAceite({
    unidad_id: unidadId,
    tipo_aceite: tipoAceite,
    kilometraje_servicio: kilometrajeServicio,
    costo_servicio: costoServicio,
    fecha_servicio: fechaServicio,
  });
}

// -------------------------------------------------------
// Editar Unidad Existente
// -------------------------------------------------------
export async function editarUnidadAction(
  _prevState: ActionResult<Unidad>,
  formData: FormData
): Promise<ActionResult<Unidad>> {
  const unidadId = Number(formData.get("unidad_id"));
  const numero_unidad = String(formData.get("numero_unidad") ?? "").trim();
  const placa = String(formData.get("placa") ?? "").trim().toUpperCase();
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const anio = Number(formData.get("anio"));

  if (isNaN(unidadId) || !numero_unidad || !placa || !marca || !modelo || isNaN(anio)) {
    return { success: false, error: "Todos los campos son requeridos y deben ser válidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const { data, error } = await supabase
    .from("unidades")
    .update({
      numero_unidad,
      placa,
      marca,
      modelo,
      anio,
    })
    .eq("id", unidadId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { success: false, error: "Ya tienes registrada otra unidad con esta placa." };
    }
    return { success: false, error: `Error al actualizar unidad: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: data as Unidad };
}
