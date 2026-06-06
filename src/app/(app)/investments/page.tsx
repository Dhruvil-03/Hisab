import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { formatINR } from "@/lib/format";
import { getAccounts } from "@/lib/queries";
import { updateInvestmentValuesAction } from "@/lib/actions/accounts";

export default async function InvestmentsPage() {
  const accounts = await getAccounts();
  const investments = accounts.filter((a) => a.type === "investment");

  const totalInvested = investments.reduce((s, a) => s + Number(a.invested_amount), 0);
  const totalCurrent = investments.reduce((s, a) => s + Number(a.current_value), 0);
  const gain = totalCurrent - totalInvested;

  return (
    <>
      <AppHeader title="Investments" />
      <main className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-[var(--muted)]">Invested</p>
            <p className="text-lg font-bold">{formatINR(totalInvested)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-[var(--muted)]">Current value</p>
            <p className="text-lg font-bold">{formatINR(totalCurrent)}</p>
          </div>
        </div>
        <p
          className={`text-center text-sm font-semibold ${
            gain >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
          }`}
        >
          {gain >= 0 ? "Gain" : "Loss"}: {formatINR(Math.abs(gain))}
        </p>

        <Link
          href="/investments/withdraw"
          className="btn btn-primary flex w-full py-3"
        >
          Withdraw investment (sell / redeem)
        </Link>

        <p className="text-sm text-[var(--muted)]">
          Put money in: Add → Transfer (bank/cash → investment). Update values below
          when price changes. Take money out: use Withdraw above.
        </p>

        {investments.length === 0 ? (
          <div className="card text-center text-sm text-[var(--muted)]">
            <p>No investments yet.</p>
            <Link href="/accounts" className="mt-2 inline-block text-[var(--primary)] font-semibold">
              Add investment account
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {investments.map((a) => {
              const g = Number(a.current_value) - Number(a.invested_amount);
              return (
                <li key={a.id} className="card">
                  <p className="font-bold">{a.name}</p>
                  {a.institution && (
                    <p className="text-sm text-[var(--muted)]">{a.institution}</p>
                  )}
                  <p className="mt-2 text-sm">
                    Invested: {formatINR(Number(a.invested_amount))} · Current:{" "}
                    {formatINR(Number(a.current_value))}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      g >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                    }`}
                  >
                    {g >= 0 ? "+" : ""}
                    {formatINR(g)}
                  </p>

                  <form action={updateInvestmentValuesAction} className="mt-3 space-y-2 border-t pt-3">
                    <input type="hidden" name="account_id" value={a.id} />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="field mb-0">
                        <label className="label">Invested</label>
                        <input
                          className="input"
                          name="invested_amount"
                          type="number"
                          step="0.01"
                          defaultValue={a.invested_amount}
                        />
                      </div>
                      <div className="field mb-0">
                        <label className="label">Current</label>
                        <input
                          className="input"
                          name="current_value"
                          type="number"
                          step="0.01"
                          defaultValue={a.current_value}
                        />
                      </div>
                    </div>
                    <SubmitButton label="Update values" />
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
