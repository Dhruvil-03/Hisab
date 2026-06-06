import { AppHeader } from "@/components/AppHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { formatINR } from "@/lib/format";
import { getAccounts } from "@/lib/queries";
import { createAccount, deleteAccountForm } from "@/lib/actions/accounts";

export default async function AccountsPage() {
  const accounts = await getAccounts();
  const cashBank = accounts.filter((a) => a.type !== "investment");
  const investments = accounts.filter((a) => a.type === "investment");

  return (
    <>
      <AppHeader title="Accounts" />
      <main className="space-y-6 px-4 py-4">
        <section className="card">
          <h2 className="mb-3 font-semibold">Add account</h2>
          <form action={createAccount} className="space-y-0">
            <div className="field">
              <label className="label">Name</label>
              <input className="input" name="name" required placeholder="e.g. HDFC Bank" />
            </div>
            <div className="field">
              <label className="label">Type</label>
              <select className="input" name="type" required defaultValue="bank">
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Opening balance / invested (₹)</label>
              <input
                className="input"
                name="opening_balance"
                type="number"
                step="0.01"
                defaultValue="0"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                For investment: use Invested and Current value below instead.
              </p>
            </div>
            <div className="field">
              <label className="label">Where invested (investment only)</label>
              <input className="input" name="institution" placeholder="e.g. Zerodha, SBI FD" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="field">
                <label className="label">Invested amount</label>
                <input
                  className="input"
                  name="invested_amount"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
              <div className="field">
                <label className="label">Current value</label>
                <input
                  className="input"
                  name="current_value"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
            </div>
            <SubmitButton label="Add account" />
          </form>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Cash & Bank</h2>
          {cashBank.length === 0 ? (
            <p className="card text-sm text-[var(--muted)]">No accounts yet.</p>
          ) : (
            <ul className="space-y-2">
              {cashBank.map((a) => (
                <li key={a.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs capitalize text-[var(--muted)]">{a.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatINR(Number(a.balance))}</p>
                    <form action={deleteAccountForm}>
                      <input type="hidden" name="account_id" value={a.id} />
                      <button type="submit" className="text-xs text-[var(--danger)]">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {investments.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold">Investment accounts</h2>
            <p className="mb-2 text-xs text-[var(--muted)]">
              Update values on the Investments page.
            </p>
            <ul className="space-y-2">
              {investments.map((a) => (
                <li key={a.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    {a.institution && (
                      <p className="text-xs text-[var(--muted)]">{a.institution}</p>
                    )}
                    <p className="mt-1 font-bold">{formatINR(Number(a.current_value))}</p>
                  </div>
                  <form action={deleteAccountForm}>
                    <input type="hidden" name="account_id" value={a.id} />
                    <button type="submit" className="text-xs text-[var(--danger)]">
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
