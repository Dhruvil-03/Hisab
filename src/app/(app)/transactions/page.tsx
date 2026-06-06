import { AppHeader } from "@/components/AppHeader";
import { formatINR, formatDate } from "@/lib/format";
import { getAllTransactions } from "@/lib/queries";
import { deleteTransactionForm } from "@/lib/actions/transactions";

const typeLabels: Record<string, string> = {
  expense: "Expense",
  income: "Income",
  transfer: "Transfer",
  investment_deposit: "To investment",
  investment_withdrawal: "From investment",
  settlement: "Received",
  loan_given: "Paid — owed",
};

export default async function TransactionsPage() {
  const transactions = await getAllTransactions();

  return (
    <>
      <AppHeader title="History" />
      <main className="px-4 py-4">
        {transactions.length === 0 ? (
          <p className="card text-center text-sm text-[var(--muted)]">No transactions yet.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => {
              const isIn =
                t.type === "income" ||
                t.type === "settlement" ||
                t.type === "investment_withdrawal";
              const cat = t.categories as { name: string } | null;
              return (
                <li key={t.id} className="card">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {t.description || typeLabels[t.type]}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {typeLabels[t.type]} · {formatDate(t.transaction_date)}
                        {cat?.name ? ` · ${cat.name}` : ""}
                        {t.personal_amount != null &&
                          t.type === "expense" &&
                          Number(t.personal_amount) !== Number(t.amount) && (
                            <> · Your share {formatINR(Number(t.personal_amount))}</>
                          )}
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
                  </div>
                  <form action={deleteTransactionForm} className="mt-2">
                    <input type="hidden" name="transaction_id" value={t.id} />
                    <button type="submit" className="text-xs text-[var(--danger)]">
                      Delete
                    </button>
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
