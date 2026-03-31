"use client";

import { TrendingDown, TrendingUp, Trash2 } from "lucide-react";

export type AccountRow = {
  id: string;
  kind: "instagram" | "facebook" | "social";
  platform: string;
  displayName: string;
  handle: string;
  followerCount: number;
  avatarUrl: string | null;
  /** Son 7 güne göre takipçi değişimi; veri yoksa null */
  weeklyDelta?: number | null;
  /** Son başarılı yüklemeden bu yana fark; ilk yüklemede null */
  recentDelta?: number | null;
};

type AccountCardProps = {
  account: AccountRow;
  followersLabel: string;
  connectedLabel: string;
  removeLabel: string;
  weeklyHint: string;
  recentHint: string;
  onRemove: () => void;
};

export function AccountCard({
  account,
  followersLabel,
  connectedLabel,
  removeLabel,
  weeklyHint,
  recentHint,
  onRemove,
}: AccountCardProps) {
  const initial = account.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700">
          {account.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-100">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-white">
            {account.displayName}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{account.handle}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            {account.followerCount.toLocaleString()}{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">{followersLabel}</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start sm:gap-3">
        <div className="flex shrink-0 items-center gap-2">
          {account.recentDelta !== undefined &&
            account.recentDelta !== null &&
            account.recentDelta !== 0 && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums transition-colors ${
                  account.recentDelta > 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                }`}
                title={recentHint}
                aria-live="polite"
              >
                {account.recentDelta > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {account.recentDelta > 0 ? "+" : ""}
                {account.recentDelta.toLocaleString()}
              </span>
            )}
          {account.weeklyDelta !== undefined && account.weeklyDelta !== null && (
            <div
              className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${
                account.weeklyDelta >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
              title={weeklyHint}
            >
              {account.weeklyDelta >= 0 ? (
                <TrendingUp className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <TrendingDown className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span>
                {account.weeklyDelta > 0 ? "+" : ""}
                {account.weeklyDelta.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <span className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-slate-900">
          {connectedLabel}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
          title={removeLabel}
          aria-label={removeLabel}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
