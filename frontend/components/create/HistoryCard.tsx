import { CreatePostHistoryItem } from "./types";

type Props = {
  title: string;
  empty: string;
  items: CreatePostHistoryItem[];
  statusMap: Record<string, string>;
  labels: {
    when: string;
    accounts: string;
  };
};

export function HistoryCard({ title, empty, items, statusMap, labels }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.title || item.caption}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {statusMap[item.status] ?? item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {labels.when}: {new Date(item.publishedAt || item.scheduledAt || item.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {labels.accounts}: {item.targets.map((t) => t.accountLabel || t.platform).join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
