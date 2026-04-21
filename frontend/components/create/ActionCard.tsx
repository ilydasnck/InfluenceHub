type Props = {
  title: string;
  publishNowLabel: string;
  scheduleLabel: string;
  loadingNow: boolean;
  loadingSchedule: boolean;
  onPublishNow: () => void;
  onSchedule: () => void;
};

export function ActionCard({
  title,
  publishNowLabel,
  scheduleLabel,
  loadingNow,
  loadingSchedule,
  onPublishNow,
  onSchedule,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={onPublishNow}
          disabled={loadingNow || loadingSchedule}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
        >
          {loadingNow ? "..." : publishNowLabel}
        </button>
        <button
          type="button"
          onClick={onSchedule}
          disabled={loadingNow || loadingSchedule}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {loadingSchedule ? "..." : scheduleLabel}
        </button>
      </div>
    </section>
  );
}
