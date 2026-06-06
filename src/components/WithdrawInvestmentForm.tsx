"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { withdrawInvestment } from "@/lib/actions/investments";
import { calcWithdrawal } from "@/lib/investment-math";
import { formatINR, todayISO } from "@/lib/format";
import type { Account } from "@/lib/types";

export function WithdrawInvestmentForm({
  investments,
  cashBank,
}: {
  investments: Account[];
  cashBank: Account[];
}) {
  const [investmentId, setInvestmentId] = useState(investments[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(cashBank[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [fullExit, setFullExit] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const selected = investments.find((a) => a.id === investmentId);
  const received = parseFloat(amount) || 0;
  const invested = selected ? Number(selected.invested_amount) : 0;
  const current = selected ? Number(selected.current_value) : 0;

  const preview = useMemo(() => {
    if (!selected || received <= 0) return null;
    return calcWithdrawal(invested, current, received);
  }, [selected, received, invested, current]);

  const autoFull = preview?.isFullExit ?? false;

  async function handleSubmit(formData: FormData) {
    setMessage("");
    if (preview?.isFullExit || fullExit) {
      formData.set("full_exit", "true");
    }
    const result = await withdrawInvestment(formData);
    if (result.error) {
      setMessage(result.error);
      setIsError(true);
      return;
    }
    setIsError(false);
    const pl = result.profitLoss ?? 0;
    setMessage(
      pl >= 0
        ? `Saved. Profit on this withdrawal: ${formatINR(pl)}`
        : `Saved. Loss on this withdrawal: ${formatINR(Math.abs(pl))}`
    );
    setAmount("");
    setFullExit(false);
  }

  if (investments.length === 0) {
    return (
      <p className="card text-sm text-[var(--muted)]">
        Add an investment account under Accounts first.
      </p>
    );
  }

  if (cashBank.length === 0) {
    return (
      <p className="card text-sm text-[var(--muted)]">
        Add a cash or bank account to receive withdrawn money.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="card space-y-4">
      <div className="field">
        <label className="label">Investment</label>
        <select
          className="input"
          name="investment_id"
          value={investmentId}
          onChange={(e) => setInvestmentId(e.target.value)}
          required
        >
          {investments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({formatINR(Number(a.current_value))})
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="rounded-lg bg-[var(--bg)] p-3 text-sm">
          <p>
            <span className="text-[var(--muted)]">Invested:</span>{" "}
            <strong>{formatINR(invested)}</strong>
          </p>
          <p>
            <span className="text-[var(--muted)]">Current value:</span>{" "}
            <strong>{formatINR(current)}</strong>
          </p>
        </div>
      )}

      <div className="field">
        <label className="label">Amount received (cash in hand)</label>
        <input
          className="input text-lg font-semibold"
          name="amount_received"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        {selected && current > 0 && (
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-[var(--primary)]"
            onClick={() => setAmount(String(current))}
          >
            Use full current value ({formatINR(current)})
          </button>
        )}
      </div>

      <div className="field">
        <label className="label">Received in</label>
        <select
          className="input"
          name="to_account_id"
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
          required
        >
          {cashBank.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.type})
            </option>
          ))}
        </select>
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

      <div className="field">
        <label className="label">Note (optional)</label>
        <input
          className="input"
          name="description"
          placeholder="e.g. Sold MF / Redeemed FD"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fullExit || autoFull}
          disabled={autoFull}
          onChange={(e) => setFullExit(e.target.checked)}
        />
        Close this investment (zero out after withdraw)
        {autoFull && (
          <span className="text-[var(--muted)]">— auto (full amount)</span>
        )}
      </label>
      <input type="hidden" name="full_exit" value={fullExit || autoFull ? "true" : "false"} />

      {preview && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            preview.profitLoss >= 0
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className="font-semibold">On this withdrawal</p>
          <p>Cost (your money out): {formatINR(preview.costBasis)}</p>
          <p className={preview.profitLoss >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>
            {preview.profitLoss >= 0 ? "Profit" : "Loss"}:{" "}
            {formatINR(Math.abs(preview.profitLoss))}
          </p>
          {!preview.isFullExit && (
            <p className="mt-1 text-[var(--muted)]">
              Left in investment: {formatINR(preview.remainingCurrent)} (invested{" "}
              {formatINR(preview.remainingInvested)})
            </p>
          )}
          {preview.isFullExit && (
            <p className="mt-1 text-[var(--muted)]">Investment will be set to zero.</p>
          )}
        </div>
      )}

      {message && (
        <p
          className={`text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
        >
          {message}
        </p>
      )}

      <SubmitButton label="Withdraw" pendingLabel="Processing..." />
    </form>
  );
}
