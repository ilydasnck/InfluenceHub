type Props = {
  title: string;
  subtitle: string;
  dateLabel: string;
  timeLabel: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  error?: string;
};

export function ScheduleCard({
  title,
  subtitle,
  dateLabel,
  timeLabel,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  error,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{dateLabel}</label>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{timeLabel}</label>
          <input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}
