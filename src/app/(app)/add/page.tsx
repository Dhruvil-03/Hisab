"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { SplitExpenseFields } from "@/components/SplitExpenseForm";
import {
  createExpense,
  createIncome,
  createTransfer,
  createLoanGiven,
} from "@/lib/actions/transactions";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Account, Category } from "@/lib/types";

type Tab = "expense" | "income" | "transfer" | "loan";

export default function AddPage() {
  const [tab, setTab] = useState<Tab>("expense");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenseCats, setExpenseCats] = useState<Category[]>([]);
  const [incomeCats, setIncomeCats] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: acc } = await supabase.from("accounts").select("*").order("name");
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      const { data: cont } = await supabase.from("contacts").select("name").order("name");
      setAccounts((acc as Account[]) ?? []);
      setExpenseCats((cats as Category[])?.filter((c) => c.type === "expense") ?? []);
      setIncomeCats((cats as Category[])?.filter((c) => c.type === "income") ?? []);
      setContacts(cont?.map((c) => c.name) ?? []);
    }
    load();
  }, []);

  const cashBank = accounts.filter((a) => a.type === "cash" || a.type === "bank");
  const allAccounts = accounts;

  async function handleAction(formData: FormData) {
    setMessage("");
    let result: { error?: string; success?: boolean };
    if (tab === "expense") result = await createExpense(formData);
    else if (tab === "income") result = await createIncome(formData);
    else if (tab === "transfer") result = await createTransfer(formData);
    else result = await createLoanGiven(formData);

    if (result.error) setMessage(result.error);
    else {
      setMessage("Saved!");
      setAmount("");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "expense", label: "Expense" },
    { id: "income", label: "Income" },
    { id: "transfer", label: "Transfer" },
    { id: "loan", label: "Paid — owed" },
  ];

  return (
    <>
      <AppHeader title="Add" />
      <main className="px-4 py-4">
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-white p-1 border border-[var(--border)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                tab === t.id
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {cashBank.length === 0 && tab !== "transfer" && (
          <p className="card mb-4 text-sm text-amber-700">
            Add a cash or bank account first (Accounts tab).
          </p>
        )}

        <form action={handleAction} className="card space-y-1">
          <div className="field">
            <label className="label">Amount (₹)</label>
            <input
              className="input text-lg font-semibold"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label className="label">Date</label>
            <input
              className="input"
              name="transaction_date"
              type="date"
              defaultValue={todayISO()}
              required
            />
          </div>

          {tab === "expense" && (
            <>
              <div className="field">
                <label className="label">Paid from</label>
                <select className="input" name="account_id" required>
                  <option value="">Select account</option>
                  {cashBank.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Category</label>
                <select className="input" name="category_id">
                  <option value="">Other</option>
                  {expenseCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Note</label>
                <input className="input" name="description" placeholder="e.g. Lunch" />
              </div>
              <SplitExpenseFields totalAmount={amount} contactSuggestions={contacts} />
            </>
          )}

          {tab === "income" && (
            <>
              <div className="field">
                <label className="label">Received in</label>
                <select className="input" name="account_id" required>
                  <option value="">Select account</option>
                  {cashBank.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Category</label>
                <select className="input" name="category_id">
                  <option value="">Other</option>
                  {incomeCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Note</label>
                <input className="input" name="description" placeholder="e.g. Salary" />
              </div>
            </>
          )}

          {tab === "transfer" && (
            <>
              <div className="field">
                <label className="label">From</label>
                <select className="input" name="from_account_id" required>
                  <option value="">Select</option>
                  {allAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">To</label>
                <select className="input" name="to_account_id" required>
                  <option value="">Select</option>
                  {allAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-[var(--muted)] mb-2">
                Use for ATM cash, bank deposit, or moving money to investment.
              </p>
              <div className="field">
                <label className="label">Note</label>
                <input className="input" name="description" placeholder="e.g. ATM withdrawal" />
              </div>
            </>
          )}

          {tab === "loan" && (
            <>
              <p className="text-sm text-[var(--muted)] mb-2">
                You paid from bank/UPI. They will return later (cash or online). Mark paid when received.
              </p>
              <div className="field">
                <label className="label">Paid from</label>
                <select className="input" name="account_id" required>
                  <option value="">Select account</option>
                  {cashBank.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Who owes you</label>
                <input
                  className="input"
                  name="contact_name"
                  list="contacts-list-loan"
                  required
                  placeholder="Name"
                />
                <datalist id="contacts-list-loan">
                  {contacts.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label className="label">Note</label>
                <input className="input" name="description" placeholder="e.g. Paid for friend" />
              </div>
            </>
          )}

          {message && (
            <p
              className={`text-sm font-medium ${
                message === "Saved!" ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {message}
            </p>
          )}

          <SubmitButton label="Save" />
        </form>
      </main>
    </>
  );
}
