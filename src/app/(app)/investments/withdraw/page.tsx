import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { WithdrawInvestmentForm } from "@/components/WithdrawInvestmentForm";
import { getAccounts } from "@/lib/queries";
import { ChevronLeft } from "lucide-react";

export default async function WithdrawInvestmentPage() {
  const accounts = await getAccounts();
  const investments = accounts.filter((a) => a.type === "investment");
  const cashBank = accounts.filter((a) => a.type === "cash" || a.type === "bank");

  return (
    <>
      <AppHeader title="Withdraw investment" />
      <main className="px-4 py-4">
        <Link
          href="/investments"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]"
        >
          <ChevronLeft size={18} /> Back to investments
        </Link>

        <p className="mb-4 text-sm text-[var(--muted)]">
          Enter cash you received in bank or wallet. Profit or loss is calculated
          automatically. Net worth stays correct (money moves from investment to
          cash/bank).
        </p>

        <WithdrawInvestmentForm investments={investments} cashBank={cashBank} />
      </main>
    </>
  );
}
