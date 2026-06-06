"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type SplitRow = { name: string; amount: string };

export function SplitExpenseFields({
  totalAmount,
  contactSuggestions,
}: {
  totalAmount: string;
  contactSuggestions: string[];
}) {
  const [enabled, setEnabled] = useState(false);
  const [myShare, setMyShare] = useState("");
  const [rows, setRows] = useState<SplitRow[]>([{ name: "", amount: "" }]);

  const total = parseFloat(totalAmount) || 0;
  const my = parseFloat(myShare) || 0;
  const splitSum = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const remaining = total - my - splitSum;

  const splitsJson = useMemo(() => {
    if (!enabled) return "[]";
    return JSON.stringify(
      rows
        .filter((r) => r.name.trim() && parseFloat(r.amount) > 0)
        .map((r) => ({ name: r.name.trim(), amount: parseFloat(r.amount) }))
    );
  }, [enabled, rows]);

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-[var(--border)] p-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        Split — others owe me
      </label>

      <input type="hidden" name="splits" value={splitsJson} />
      <input type="hidden" name="personal_amount" value={enabled ? String(my || total) : totalAmount} />

      {enabled && (
        <>
          <div className="field mb-0">
            <label className="label">Your share (expense for you)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              max={total}
              value={myShare}
              onChange={(e) => setMyShare(e.target.value)}
              placeholder={total ? String(total) : "0"}
            />
          </div>

          <p className="text-xs text-[var(--muted)]">Who owes you</p>
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                name={`split_name_${i}`}
                list="contacts-list"
                placeholder="Name"
                value={row.name}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...next[i], name: e.target.value };
                  setRows(next);
                }}
              />
              <input
                className="input w-28"
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...next[i], amount: e.target.value };
                  setRows(next);
                }}
              />
              <button
                type="button"
                className="btn btn-secondary px-2"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                disabled={rows.length === 1}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary w-full text-sm"
            onClick={() => setRows([...rows, { name: "", amount: "" }])}
          >
            <Plus size={16} /> Add person
          </button>

          {total > 0 && (
            <p
              className={`text-xs font-medium ${
                Math.abs(remaining) < 0.02 ? "text-[var(--success)]" : "text-amber-600"
              }`}
            >
              {Math.abs(remaining) < 0.02
                ? "Amounts match total"
                : `Unassigned: ${remaining.toFixed(2)} (should be 0)`}
            </p>
          )}

          <datalist id="contacts-list">
            {contactSuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </>
      )}
    </div>
  );
}
