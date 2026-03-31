import type { ReactNode } from "react";

type StatsCardProps = {
  label: string;
  value: string;
  /** Küçük dekoratif ikon (sol üst) */
  icon?: ReactNode;
};

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 px-6 py-5 shadow-sm transition hover:border-slate-300/90 hover:shadow-md dark:border-slate-700/90 dark:from-slate-900 dark:to-slate-900/80 dark:hover:border-slate-600">
      {icon && (
        <div
          className="pointer-events-none absolute -right-1 -top-1 opacity-[0.12] transition group-hover:opacity-[0.18] dark:opacity-[0.15]"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className="relative text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="relative mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
