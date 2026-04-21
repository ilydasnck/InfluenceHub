import Link from "next/link";
import { CreateAccountOption } from "./types";

type Props = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDesc: string;
  goAccounts: string;
  accounts: CreateAccountOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  error?: string;
};

export function SelectAccountsCard({
  title,
  subtitle,
  emptyTitle,
  emptyDesc,
  goAccounts,
  accounts,
  selectedIds,
  onToggle,
  error,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

      {accounts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{emptyDesc}</p>
          <Link
            href="/dashboard/accounts"
            className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {goAccounts}
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {accounts.map((a) => {
            const selected = selectedIds.includes(a.id);
            return (
              <label
                key={`${a.kind}-${a.id}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  selected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(a.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.platform} - {a.handle}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}