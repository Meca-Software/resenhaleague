"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getRegulations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("regulations")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching regulations:", error);
    return [];
  }

  return data;
}

export async function addRegulation(title: string, content: string, orderIndex: number, section: string = 'Geral') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Usuário não autenticado" };

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from("regulations")
    .insert({ title, content, order_index: orderIndex, section });

  if (error) {
    console.error("Error adding regulation:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/regulamento");
  revalidatePath("/admin/regulamento");
  return { success: true };
}

export async function updateRegulation(id: string, title: string, content: string, orderIndex: number, section: string = 'Geral') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Usuário não autenticado" };

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from("regulations")
    .update({ title, content, order_index: orderIndex, section })
    .eq("id", id);

  if (error) {
    console.error("Error updating regulation:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/regulamento");
  revalidatePath("/admin/regulamento");
  return { success: true };
}

export async function deleteRegulation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Usuário não autenticado" };

  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from("regulations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting regulation:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/regulamento");
  revalidatePath("/admin/regulamento");
  return { success: true };
}
