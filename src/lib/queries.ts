import { createClient } from "@/lib/supabase/server";
import type { Account, Category, DashboardSummary, SplitReceivable } from "@/lib/types";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("type")
    .order("name");
  return (data as Account[]) ?? [];
}

export async function getCategories(type?: "income" | "expense"): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").order("name");
  if (type) query = query.eq("type", type);
  const { data } = await query;
  return (data as Category[]) ?? [];
}

export async function getContacts(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("contacts").select("name").order("name");
  return data?.map((c) => c.name) ?? [];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const accounts = await getAccounts();

  let cashTotal = 0;
  let bankTotal = 0;
  let investmentCurrent = 0;
  let investmentInvested = 0;

  for (const a of accounts) {
    const bal = Number(a.balance);
    if (a.type === "cash") cashTotal += bal;
    else if (a.type === "bank") bankTotal += bal;
    else if (a.type === "investment") {
      investmentCurrent += Number(a.current_value);
      investmentInvested += Number(a.invested_amount);
    }
  }

  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("split_receivables")
    .select("amount")
    .eq("status", "pending");

  const pendingReceivables =
    pending?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

  const netWorth =
    cashTotal + bankTotal + investmentCurrent + pendingReceivables;

  return {
    cashTotal,
    bankTotal,
    investmentCurrent,
    investmentInvested,
    pendingReceivables,
    netWorth,
  };
}

export async function getRecentTransactions(limit = 15) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getAllTransactions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPendingReceivables(): Promise<
  (SplitReceivable & { description?: string; transaction_date?: string })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("split_receivables")
    .select("*, transactions(description, transaction_date)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    data?.map((row) => {
      const { transactions, ...rest } = row;
      const txnMeta = transactions as { description?: string; transaction_date?: string } | null;
      return {
        ...(rest as SplitReceivable),
        description: txnMeta?.description,
        transaction_date: txnMeta?.transaction_date,
      };
    }) ?? []
  );
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
