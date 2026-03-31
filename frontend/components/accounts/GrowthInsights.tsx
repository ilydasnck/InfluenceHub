"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GrowthData = {
  netFollowers7d: number | null;
  netFollowers30d: number | null;
  distribution: Array<{
    accountId: string;
    kind: string;
    platform: string;
    label: string;
    followers: number;
    sharePercent: number;
  }>;
  /** UTC günü → toplam takipçi (backend snapshot serisi) */
  series?: { date: string; total: number }[];
};

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
  "#a855f7",
];

export type GrowthLabels = {
  title: string;
  subtitle: string;
  net7: string;
  net30: string;
  noData: string;
  distributionTitle: string;
  chartNetTitle: string;
  chartShareTitle: string;
  chartLineTitle: string;
  chartLineHint: string;
  tableTitle: string;
  colAccount: string;
  colPlatform: string;
  colFollowers: string;
  colShare: string;
  colWeekly: string;
  period7Short: string;
  period30Short: string;
  tooltipFollowers: string;
  tooltipShare: string;
  sortBy: string;
  platformFallback: string;
};

type GrowthInsightsProps = {
  growth: GrowthData | null;
  labels: GrowthLabels;
  nf: Intl.NumberFormat;
  locale: string;
  /** Hesap id → haftalık takipçi değişimi (tablo için) */
  weeklyByAccountId?: Record<string, number | null | undefined>;
  platformNames: Record<string, string>;
};

function formatChartDay(isoDate: string, locale: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  return d.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function NetChange({
  value,
  label,
  noData,
}: {
  value: number | null;
  label: string;
  noData: string;
}) {
  if (value === null) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:to-slate-900/80">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-3 text-base font-semibold leading-snug text-slate-400 dark:text-slate-500">
          {noData}
        </p>
      </div>
    );
  }

  const up = value >= 0;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        up
          ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-slate-900"
          : "border-red-200/80 bg-gradient-to-br from-red-50/90 to-white dark:border-red-900/50 dark:from-red-950/40 dark:to-slate-900"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl ${
          up ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
      <p className="relative text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <div
        className={`relative mt-3 flex items-center gap-2 text-2xl font-bold tabular-nums tracking-tight ${
          up ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
        }`}
      >
        {up ? (
          <TrendingUp className="h-7 w-7 shrink-0" aria-hidden />
        ) : (
          <TrendingDown className="h-7 w-7 shrink-0" aria-hidden />
        )}
        <span>
          {value > 0 ? "+" : ""}
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

type NetTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload?: { period: string; full: number | null; value: number };
  }>;
  labels: GrowthLabels;
  nf: Intl.NumberFormat;
};

function NetTooltip({ active, payload, labels, nf }: NetTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (!row || row.full === null) return null;
  const up = row.full >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-900">
      <p className="font-medium text-slate-700 dark:text-slate-200">{row.period}</p>
      <p
        className={`mt-1 tabular-nums font-semibold ${
          up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {row.full > 0 ? "+" : ""}
        {nf.format(row.full)}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{labels.tooltipFollowers}</p>
    </div>
  );
}

type ShareTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: { sharePercent: number; label: string };
  }>;
  labels: GrowthLabels;
  nf: Intl.NumberFormat;
};

function ShareTooltip({ active, payload, labels, nf }: ShareTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const raw = item.payload as { sharePercent: number; label: string } | undefined;
  const label = raw?.label ?? item.name ?? "";
  const followers = typeof item.value === "number" ? item.value : 0;
  const share = raw?.sharePercent ?? 0;
  return (
    <div className="max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-900">
      <p className="font-medium text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 tabular-nums text-slate-700 dark:text-slate-200">
        {nf.format(followers)} {labels.tooltipFollowers}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {labels.tooltipShare}: {share}%
      </p>
    </div>
  );
}

type LineTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: { date: string; total: number; dayLabel: string };
  }>;
  labels: GrowthLabels;
  nf: Intl.NumberFormat;
  locale: string;
};

function LineTooltip({ active, payload, labels, nf, locale }: LineTooltipProps) {
  if (!active || !payload?.length) return null;
  const row =
    (payload[0].payload as { date: string; total: number } | undefined) ??
    (payload[0] as unknown as { date: string; total: number });
  if (!row?.date) return null;
  const fullDate = new Date(`${row.date}T12:00:00.000Z`).toLocaleDateString(
    locale === "tr" ? "tr-TR" : "en-US",
    { dateStyle: "medium" },
  );
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-900">
      <p className="font-medium text-slate-900 dark:text-white">{fullDate}</p>
      <p className="mt-1 tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
        {nf.format(row.total)} {labels.tooltipFollowers}
      </p>
    </div>
  );
}

type SortKey = "label" | "platform" | "followers" | "share" | "weekly";

export function GrowthInsights({
  growth,
  labels,
  nf,
  locale,
  weeklyByAccountId = {},
  platformNames,
}: GrowthInsightsProps) {
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const barData = useMemo(() => {
    if (!growth) return [];
    const rows: Array<{ period: string; value: number; full: number | null }> = [];
    if (growth.netFollowers7d !== null) {
      rows.push({
        period: labels.period7Short,
        value: growth.netFollowers7d,
        full: growth.netFollowers7d,
      });
    }
    if (growth.netFollowers30d !== null) {
      rows.push({
        period: labels.period30Short,
        value: growth.netFollowers30d,
        full: growth.netFollowers30d,
      });
    }
    return rows;
  }, [growth, labels.period7Short, labels.period30Short]);

  const pieData = useMemo(() => {
    if (!growth?.distribution.length) return [];
    return growth.distribution.map((d) => ({
      name: d.label,
      value: d.followers,
      sharePercent: d.sharePercent,
      label: d.label,
      accountId: d.accountId,
      platform: d.platform,
    }));
  }, [growth]);

  const lineData = useMemo(() => {
    const s = growth?.series ?? [];
    return s.map((row) => ({
      ...row,
      dayLabel: formatChartDay(row.date, locale),
    }));
  }, [growth?.series, locale]);

  const tableRows = useMemo(() => {
    if (!growth?.distribution.length) return [];
    return growth.distribution.map((d) => ({
      ...d,
      weekly: weeklyByAccountId[d.accountId],
    }));
  }, [growth, weeklyByAccountId]);

  const sortedTable = useMemo(() => {
    const copy = [...tableRows];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "label":
          cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
          break;
        case "platform":
          cmp = a.platform.localeCompare(b.platform);
          break;
        case "followers":
          cmp = a.followers - b.followers;
          break;
        case "share":
          cmp = a.sharePercent - b.sharePercent;
          break;
        case "weekly": {
          const wa = a.weekly;
          const wb = b.weekly;
          const na = wa === undefined || wa === null ? Number.NEGATIVE_INFINITY : wa;
          const nb = wb === undefined || wb === null ? Number.NEGATIVE_INFINITY : wb;
          cmp = na - nb;
          break;
        }
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [tableRows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "label" || key === "platform" ? "asc" : "desc");
    }
  }

  function platformLabel(p: string): string {
    return platformNames[p] ?? platformNames[p.toLowerCase()] ?? labels.platformFallback;
  }

  if (!growth) {
    return null;
  }
  const hasDistribution = growth.distribution.length > 0;
  const hasNets =
    growth.netFollowers7d !== null || growth.netFollowers30d !== null;
  if (!hasDistribution && !hasNets) {
    return null;
  }

  const showBarChart = barData.length > 0;
  const showPie = pieData.length > 0;
  const showLineChart = lineData.length > 0;

  return (
    <section
      className="mb-10 overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-white shadow-sm dark:border-slate-700/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900"
      aria-labelledby="growth-insights-heading"
    >
      <div className="border-b border-slate-200/80 bg-white/60 px-5 py-5 dark:border-slate-700/80 dark:bg-slate-900/40 sm:px-8">
        <h2
          id="growth-insights-heading"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          {labels.title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {labels.subtitle}
        </p>
      </div>

      <div className="space-y-8 px-5 py-6 sm:px-8">
        {hasNets && (
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <NetChange
                value={growth.netFollowers7d}
                label={labels.net7}
                noData={labels.noData}
              />
              <NetChange
                value={growth.netFollowers30d}
                label={labels.net30}
                noData={labels.noData}
              />
            </div>
          </div>
        )}

        {(showBarChart || showPie) && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {showBarChart && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {labels.chartNetTitle}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {labels.tooltipFollowers}
                </p>
                <div className="mt-4 h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-slate-200 dark:stroke-slate-700"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-slate-600 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-500 dark:text-slate-400"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => nf.format(Number(v))}
                      />
                      <Tooltip
                        content={<NetTooltip labels={labels} nf={nf} />}
                        cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
                        {barData.map((entry) => (
                          <Cell
                            key={entry.period}
                            fill={
                              entry.full !== null && entry.full >= 0
                                ? "#10b981"
                                : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {showPie && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50 sm:p-5 xl:col-span-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {labels.chartShareTitle}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {labels.distributionTitle}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                  <div className="h-[240px] min-h-[200px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={4}
                          stroke="transparent"
                          strokeWidth={0}
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ShareTooltip labels={labels} nf={nf} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex min-h-[200px] min-w-0 flex-col">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      {labels.chartLineTitle}
                    </h4>
                    <p className="mb-2 text-[11px] leading-snug text-slate-500 dark:text-slate-500">
                      {labels.chartLineHint}
                    </p>
                    {showLineChart ? (
                      <div className="min-h-[200px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={lineData}
                            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-slate-200 dark:stroke-slate-700"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="dayLabel"
                              tick={{ fontSize: 10, fill: "currentColor" }}
                              className="text-slate-500 dark:text-slate-400"
                              axisLine={false}
                              tickLine={false}
                              interval="preserveStartEnd"
                              minTickGap={8}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "currentColor" }}
                              className="text-slate-500 dark:text-slate-400"
                              axisLine={false}
                              tickLine={false}
                              width={44}
                              tickFormatter={(v) => nf.format(Number(v))}
                            />
                            <Tooltip
                              content={
                                <LineTooltip labels={labels} nf={nf} locale={locale} />
                              }
                              cursor={{ stroke: "rgba(99, 102, 241, 0.35)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#6366f1"
                              strokeWidth={2.5}
                              dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                              activeDot={{ r: 5, stroke: "#a5b4fc", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                        {labels.noData}
                      </div>
                    )}
                  </div>
                </div>
                <ul className="mt-4 flex max-h-[180px] flex-col gap-2 overflow-y-auto text-xs sm:grid sm:max-h-none sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2">
                  {pieData.map((d, i) => (
                    <li key={d.accountId} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="min-w-0 flex-1 leading-snug text-slate-700 dark:text-slate-300">
                        <span className="font-medium">{d.label}</span>
                        <span className="block tabular-nums text-slate-500 dark:text-slate-400">
                          {nf.format(d.value)} · {d.sharePercent}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {hasDistribution && sortedTable.length > 0 && (
          <div>
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {labels.tableTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{labels.sortBy}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/40">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/50">
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleSort("platform")}
                        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        {labels.colPlatform}
                        {sortKey === "platform" && (
                          <span className="text-xs opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleSort("label")}
                        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        {labels.colAccount}
                        {sortKey === "label" && (
                          <span className="text-xs opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleSort("followers")}
                        className="inline-flex w-full items-center justify-end gap-1 rounded-md px-1 py-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        {labels.colFollowers}
                        {sortKey === "followers" && (
                          <span className="text-xs opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleSort("share")}
                        className="inline-flex w-full items-center justify-end gap-1 rounded-md px-1 py-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        {labels.colShare}
                        {sortKey === "share" && (
                          <span className="text-xs opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleSort("weekly")}
                        className="inline-flex w-full items-center justify-end gap-1 rounded-md px-1 py-0.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        {labels.colWeekly}
                        {sortKey === "weekly" && (
                          <span className="text-xs opacity-70">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTable.map((row, idx) => (
                    <tr
                      key={row.accountId}
                      className={
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900/20"
                          : "bg-slate-50/50 dark:bg-slate-800/20"
                      }
                    >
                      <td className="border-t border-slate-100 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {platformLabel(row.platform)}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 font-medium text-slate-900 dark:border-slate-800 dark:text-white">
                        {row.label}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-right tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                        {nf.format(row.followers)}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-right tabular-nums text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        {row.sharePercent}%
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-right">
                        <WeeklyCell value={row.weekly} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function WeeklyCell({ value }: { value: number | null | undefined }) {
  if (value === undefined) {
    return <span className="text-slate-400">—</span>;
  }
  if (value === null) {
    return (
      <span className="tabular-nums text-slate-400 dark:text-slate-500" title="—">
        —
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center justify-end gap-1 tabular-nums font-semibold ${
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      {up ? (
        <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {value > 0 ? "+" : ""}
      {value.toLocaleString()}
    </span>
  );
}
