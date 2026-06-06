"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/types";

export async function createAccount(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as AccountType;
  const opening = parseFloat((formData.get("opening_balance") as string) || "0");
  const institution = (formData.get("institution") as string)?.trim() || null;
  const invested = parseFloat((formData.get("invested_amount") as string) || "0");
  const current = parseFloat((formData.get("current_value") as string) || "0");

  if (!name) return { success: false, error: "Name is required" };

  const balance = type === "investment" ? current : opening;

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    opening_balance: type === "investment" ? 0 : opening,
    balance,
    institution: type === "investment" ? institution : null,
    invested_amount: type === "investment" ? invested : 0,
    current_value: type === "investment" ? current : 0,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/accounts");
  return { success: true };
}

export async function updateInvestmentValues(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const accountId = formData.get("account_id") as string;
  const invested = parseFloat((formData.get("invested_amount") as string) || "0");
  const current = parseFloat((formData.get("current_value") as string) || "0");

  const { error } = await supabase
    .from("accounts")
    .update({
      invested_amount: invested,
      current_value: current,
      balance: current,
    })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/investments");
  return { success: true };
}

export async function deleteAccountForm(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const accountId = formData.get("account_id") as string;
  if (!accountId) return { success: false, error: "Account ID is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/investments");
  return { success: true };
}

// Wrapper server actions for form action= attributes (must return void)
export async function createAccountAction(formData: FormData): Promise<void> {
  await createAccount(formData);
}

export async function deleteAccountFormAction(formData: FormData): Promise<void> {
  await deleteAccountForm(formData);
}

export async function updateInvestmentValuesAction(formData: FormData): Promise<void> {
  await updateInvestmentValues(formData);
}
