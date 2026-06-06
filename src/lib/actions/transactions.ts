"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function adjustBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  userId: string,
  delta: number
) {
  const { data: account } = await supabase
    .from("accounts")
    .select("balance, type, invested_amount, current_value")
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

async function upsertContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string
) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase
    .from("contacts")
    .upsert({ user_id: userId, name: trimmed }, { onConflict: "user_id,name" });
}

export async function createIncome(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const amount = parseFloat(formData.get("amount") as string);
  const accountId = formData.get("account_id") as string;
  const categoryId = formData.get("category_id") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const date = (formData.get("transaction_date") as string) || new Date().toISOString().slice(0, 10);

  if (!amount || amount <= 0) return;

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "income",
      amount,
      personal_amount: amount,
      description,
      category_id: categoryId || null,
      transaction_date: date,
    })
    .select("id")
    .single();

  if (txnError || !txn) return;

  await supabase.from("account_movements").insert({
    transaction_id: txn.id,
    account_id: accountId,
    amount,
  });

  await adjustBalance(supabase, accountId, user.id, amount);

  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createExpense(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const amount = parseFloat(formData.get("amount") as string);
  const personalAmount = parseFloat(
    (formData.get("personal_amount") as string) || String(amount)
  );
  const accountId = formData.get("account_id") as string;
  const categoryId = formData.get("category_id") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const date = (formData.get("transaction_date") as string) || new Date().toISOString().slice(0, 10);
  const splitsJson = formData.get("splits") as string | null;

  if (!amount || amount <= 0) return;

  let splits: { name: string; amount: number }[] = [];
  if (splitsJson) {
    try {
      splits = JSON.parse(splitsJson);
    } catch {
      return;
    }
  }

  const splitTotal = splits.reduce((s, x) => s + x.amount, 0);
  if (splitTotal > amount + 0.01) {
    return;
  }

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "expense",
      amount,
      personal_amount: personalAmount,
      description,
      category_id: categoryId || null,
      transaction_date: date,
    })
    .select("id")
    .single();

  if (txnError || !txn) return;

  await supabase.from("account_movements").insert({
    transaction_id: txn.id,
    account_id: accountId,
    amount: -amount,
  });

  await adjustBalance(supabase, accountId, user.id, -amount);

  for (const split of splits) {
    if (!split.name?.trim() || split.amount <= 0) continue;
    await upsertContact(supabase, user.id, split.name);
    await supabase.from("split_receivables").insert({
      user_id: user.id,
      transaction_id: txn.id,
      contact_name: split.name.trim(),
      amount: split.amount,
      status: "pending",
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/receivables");
}

export async function createTransfer(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const amount = parseFloat(formData.get("amount") as string);
  const fromId = formData.get("from_account_id") as string;
  const toId = formData.get("to_account_id") as string;
  const description = (formData.get("description") as string)?.trim() || "Transfer";
  const date = (formData.get("transaction_date") as string) || new Date().toISOString().slice(0, 10);

  if (!amount || amount <= 0) return;
  if (fromId === toId) return;

  const { data: fromAcc } = await supabase
    .from("accounts")
    .select("type")
    .eq("id", fromId)
    .single();
  const { data: toAcc } = await supabase
    .from("accounts")
    .select("type")
    .eq("id", toId)
    .single();

  const isInvestmentMove =
    fromAcc?.type === "investment" || toAcc?.type === "investment";
  const txnType = isInvestmentMove
    ? fromAcc?.type === "investment"
      ? "investment_withdrawal"
      : "investment_deposit"
    : "transfer";

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: txnType,
      amount,
      personal_amount: amount,
      description,
      transaction_date: date,
    })
    .select("id")
    .single();

  if (txnError || !txn) return;

  await supabase.from("account_movements").insert([
    { transaction_id: txn.id, account_id: fromId, amount: -amount },
    { transaction_id: txn.id, account_id: toId, amount },
  ]);

  await adjustBalance(supabase, fromId, user.id, -amount);
  await adjustBalance(supabase, toId, user.id, amount);

  if (toAcc?.type === "investment") {
    const { data: inv } = await supabase
      .from("accounts")
      .select("invested_amount")
      .eq("id", toId)
      .single();
    if (inv) {
      await supabase
        .from("accounts")
        .update({ invested_amount: Number(inv.invested_amount) + amount })
        .eq("id", toId);
    }
  }

  if (fromAcc?.type === "investment") {
    const { data: inv } = await supabase
      .from("accounts")
      .select("invested_amount, current_value")
      .eq("id", fromId)
      .single();
    if (inv) {
      const newInvested = Math.max(0, Number(inv.invested_amount) - amount);
      await supabase
        .from("accounts")
        .update({ invested_amount: newInvested })
        .eq("id", fromId);
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/investments");
}

export async function createLoanGiven(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const amount = parseFloat(formData.get("amount") as string);
  const accountId = formData.get("account_id") as string;
  const contactName = (formData.get("contact_name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "Paid — awaiting return";
  const date = (formData.get("transaction_date") as string) || new Date().toISOString().slice(0, 10);

  if (!amount || amount <= 0) return;
  if (!contactName) return;

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "loan_given",
      amount,
      personal_amount: 0,
      description,
      transaction_date: date,
    })
    .select("id")
    .single();

  if (txnError || !txn) return;

  await supabase.from("account_movements").insert({
    transaction_id: txn.id,
    account_id: accountId,
    amount: -amount,
  });

  await adjustBalance(supabase, accountId, user.id, -amount);
  await upsertContact(supabase, user.id, contactName);

  await supabase.from("split_receivables").insert({
    user_id: user.id,
    transaction_id: txn.id,
    contact_name: contactName,
    amount,
    status: "pending",
  });

  revalidatePath("/");
  revalidatePath("/receivables");
}

export async function settleReceivable(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const receivableId = formData.get("receivable_id") as string;
  const accountId = formData.get("account_id") as string;
  const date = (formData.get("transaction_date") as string) || new Date().toISOString().slice(0, 10);

  const { data: rec } = await supabase
    .from("split_receivables")
    .select("*")
    .eq("id", receivableId)
    .eq("user_id", user.id)
    .single();

  if (!rec || rec.status === "paid") return;

  const amount = Number(rec.amount);

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "settlement",
      amount,
      personal_amount: 0,
      description: `Payment from ${rec.contact_name}`,
      transaction_date: date,
    })
    .select("id")
    .single();

  if (txnError || !txn) return;

  await supabase.from("account_movements").insert({
    transaction_id: txn.id,
    account_id: accountId,
    amount,
  });

  await adjustBalance(supabase, accountId, user.id, amount);

  await supabase
    .from("split_receivables")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      settlement_transaction_id: txn.id,
      paid_to_account_id: accountId,
    })
    .eq("id", receivableId);

  revalidatePath("/");
  revalidatePath("/receivables");
  revalidatePath("/transactions");
}

export async function deleteTransactionForm(formData: FormData): Promise<void> {
  const transactionId = formData.get("transaction_id") as string;
  if (!transactionId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: movements } = await supabase
    .from("account_movements")
    .select("account_id, amount")
    .eq("transaction_id", transactionId);

  const { data: txn } = await supabase
    .from("transactions")
    .select("type")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single();

  if (!txn) return;

  if (movements) {
    for (const m of movements) {
      await adjustBalance(supabase, m.account_id, user.id, -Number(m.amount));
    }
  }

  await supabase
    .from("split_receivables")
    .delete()
    .eq("transaction_id", transactionId);

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) return;

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/receivables");
}
