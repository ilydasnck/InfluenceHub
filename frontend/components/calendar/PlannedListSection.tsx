"use client";

type ListItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
};

type Props = {
  title: string;
  empty: string;
  items: ListItem[];
};

export function PlannedListSection({ title, empty, items }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                {item.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export type { ListItem };
