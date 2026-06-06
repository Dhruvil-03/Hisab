import { formatINR } from "@/lib/format";

export function SummaryCard({
  label,
  amount,
  sub,
  highlight,
}: {
  label: string;
  amount: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`card ${highlight ? "border-[var(--primary)] bg-teal-50/50" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{formatINR(amount)}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
