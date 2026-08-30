"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { ActionResult, GastoManoObra } from "@/lib/types";

export async function registrarGastoManoObraAction(
  _prevState: ActionResult<GastoManoObra>,
  formData: FormData
): Promise<ActionResult<GastoManoObra>> {
  const unidadId = Number(formData.get("unidad_id"));
  const concepto = String(formData.get("concepto") ?? "").trim();
  const costo = Number(formData.get("costo"));
  const fecha = String(formData.get("fecha") ?? "");
  const notas = String(formData.get("notas") ?? "").trim();

  if (isNaN(unidadId) || !concepto || isNaN(costo) || costo < 0 || !fecha) {
    return { success: false, error: "Faltan campos obligatorios o son inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "No estás autenticado." };
  }

  const { data, error } = await supabase
    .from("gastos_mano_obra")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      concepto,
      costo,
      fecha,
      notas: notas || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Error al registrar mano de obra: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true, data: data as GastoManoObra };
}
