import { AppHeader } from "@/components/AppHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { formatINR, formatDate, todayISO } from "@/lib/format";
import { getPendingReceivables, getAccounts } from "@/lib/queries";
import { settleReceivable } from "@/lib/actions/transactions";

export default async function ReceivablesPage() {
  const [pending, accounts] = await Promise.all([
    getPendingReceivables(),
    getAccounts(),
  ]);

  const cashBank = accounts.filter((a) => a.type === "cash" || a.type === "bank");
  const total = pending.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <>
      <AppHeader title="Owed to you" />
      <main className="space-y-4 px-4 py-4">
        <div className="card bg-amber-50">
          <p className="text-sm text-[var(--muted)]">Total pending</p>
          <p className="text-2xl font-bold text-amber-700">{formatINR(total)}</p>
        </div>

        <p className="text-sm text-[var(--muted)]">
          When someone pays you, mark as paid and choose Cash or Bank.
        </p>

        {pending.length === 0 ? (
          <p className="card text-center text-sm text-[var(--muted)]">
            No pending payments. Use split on expense or &quot;Paid — owed&quot; when adding.
          </p>
        ) : (
          <ul className="space-y-4">
            {pending.map((r) => (
              <li key={r.id} className="card">
                <div className="mb-3 flex justify-between">
                  <div>
                    <p className="text-lg font-bold">{r.contact_name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {r.description || "Owes you"} ·{" "}
                      {r.transaction_date ? formatDate(r.transaction_date) : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-amber-600">
                    {formatINR(Number(r.amount))}
                  </p>
                </div>

                <form action={settleReceivable} className="space-y-2 border-t border-[var(--border)] pt-3">
                  <input type="hidden" name="receivable_id" value={r.id} />
                  <input type="hidden" name="transaction_date" value={todayISO()} />
                  <div className="field mb-0">
                    <label className="label">Received in</label>
                    <select className="input" name="account_id" required>
                      <option value="">Cash or Bank</option>
                      {cashBank.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <SubmitButton label="Mark paid" pendingLabel="Saving..." />
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
