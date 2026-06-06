import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SummaryCard } from "@/components/SummaryCard";
import { formatINR, formatDate } from "@/lib/format";
import {
  getDashboardSummary,
  getProfile,
  getRecentTransactions,
  getPendingReceivables,
} from "@/lib/queries";
import { PlusCircle, ChevronRight } from "lucide-react";

const typeLabels: Record<string, string> = {
  expense: "Expense",
  income: "Income",
  transfer: "Transfer",
  investment_deposit: "To investment",
  investment_withdrawal: "From investment",
  settlement: "Received",
  loan_given: "Paid — owed to you",
};

export default async function HomePage() {
  const [summary, profile, recent, pending] = await Promise.all([
    getDashboardSummary(),
    getProfile(),
    getRecentTransactions(8),
    getPendingReceivables(),
  ]);

  return (
    <>
      <AppHeader title="Dashboard" userName={profile?.display_name} />

      <main className="space-y-4 px-4 py-4">
        <div className="card border-[var(--primary)] bg-gradient-to-br from-teal-50 to-white">
          <p className="text-sm font-medium text-[var(--muted)]">Net worth</p>
          <p className="text-3xl font-bold text-[var(--primary-dark)]">
            {formatINR(summary.netWorth)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Cash + Bank + Investments + Pending from others
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Cash" amount={summary.cashTotal} />
          <SummaryCard label="Bank" amount={summary.bankTotal} />
          <SummaryCard
            label="Investments"
            amount={summary.investmentCurrent}
            sub={`Invested ${formatINR(summary.investmentInvested)}`}
          />
          <SummaryCard
            label="Pending from others"
            amount={summary.pendingReceivables}
            highlight={summary.pendingReceivables > 0}
          />
        </div>

        {pending.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Needs payment</h2>
              <Link href="/receivables" className="text-sm text-[var(--primary)]">
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {pending.slice(0, 3).map((r) => (
                <Link
                  key={r.id}
                  href="/receivables"
                  className="card flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold">{r.contact_name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {r.description || "Owes you"}
                    </p>
                  </div>
                  <p className="font-bold text-amber-600">{formatINR(Number(r.amount))}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          href="/add"
          className="btn btn-primary flex w-full gap-2 py-4 text-base shadow-sm"
        >
          <PlusCircle size={22} />
          Add transaction
        </Link>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Recent</h2>
            <Link
              href="/transactions"
              className="flex items-center text-sm text-[var(--primary)]"
            >
              History <ChevronRight size={16} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="card text-center text-sm text-[var(--muted)]">
              No transactions yet. Add your first account, then record income or expense.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => {
                const isIn =
                  t.type === "income" ||
                  t.type === "settlement" ||
                  t.type === "investment_withdrawal";
                const cat = t.categories as { name: string } | null;
                return (
                  <li key={t.id} className="card flex justify-between gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {t.description || typeLabels[t.type] || t.type}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {typeLabels[t.type]} · {formatDate(t.transaction_date)}
                        {cat?.name ? ` · ${cat.name}` : ""}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 font-bold ${
                        isIn ? "amount-positive" : "amount-negative"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {formatINR(Number(t.amount))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
