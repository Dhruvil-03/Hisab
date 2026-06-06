"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcWithdrawal } from "@/lib/investment-math";

async function adjustBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  userId: string,
  delta: number
) {
  const { data: account } = await supabase
    .from("accounts")
    .select("balance, type")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (!account) throw new Error("Account not found");

  const newBalance = Number(account.balance) + delta;
  const updates: Record<string, number> = { balance: newBalance };

  if (account.type === "investment") {
    updates.current_value = newBalance;
  }

  await supabase.from("accounts").update(updates).eq("id", accountId);
}

export async function withdrawInvestment(
  formData: FormData
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const investmentId = formData.get("investment_id") as string;
  const toAccountId = formData.get("to_account_id") as string;
  const amount = parseFloat(formData.get("amount_received") as string);
  const fullExit = formData.get("full_exit") === "true";
  const description = (formData.get("description") as string)?.trim() || "Investment withdrawal";
  const date =
    (formData.get("transaction_date") as string) || new Date().toISOString().slice(0, 10);

  if (!investmentId || !toAccountId) return;
  if (!amount || amount <= 0) return;

  const { data: inv } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", investmentId)
    .eq("user_id", user.id)
    .single();

  if (!inv || inv.type !== "investment") return;

  const { data: toAcc } = await supabase
    .from("accounts")
    .select("type")
    .eq("id", toAccountId)
    .eq("user_id", user.id)
    .single();

  if (!toAcc || (toAcc.type !== "cash" && toAcc.type !== "bank")) {
    return;
  }

  const invested = Number(inv.invested_amount);
  const current = Number(inv.current_value);

  if (current <= 0 && invested <= 0) {
    return;
  }

  const calc = calcWithdrawal(invested, current, amount);
  if (!calc) return;

  const isFull = fullExit || calc.isFullExit;
  const profitLoss = calc.profitLoss;
  const plLabel = profitLoss >= 0 ? "Profit" : "Loss";
  const txnNote = `${description} (${plLabel}: ₹${Math.abs(profitLoss).toFixed(2)})`;

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "investment_withdrawal",
      amount,
      personal_amount: amount,
      description: txnNote,
      transaction_date: date,
    })
    .select("id")
    .single();

  if (txnError || !txn) return;

  await supabase.from("account_movements").insert([
    { transaction_id: txn.id, account_id: investmentId, amount: -amount },
    { transaction_id: txn.id, account_id: toAccountId, amount },
  ]);

  await adjustBalance(supabase, investmentId, user.id, -amount);
  await adjustBalance(supabase, toAccountId, user.id, amount);

  if (isFull) {
    await supabase
      .from("accounts")
      .update({ balance: 0, current_value: 0, invested_amount: 0 })
      .eq("id", investmentId);
  } else {
    await supabase
      .from("accounts")
      .update({
        invested_amount: calc.remainingInvested,
        current_value: calc.remainingCurrent,
        balance: calc.remainingCurrent,
      })
      .eq("id", investmentId);
  }

  revalidatePath("/");
  revalidatePath("/investments");
  revalidatePath("/investments/withdraw");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}
