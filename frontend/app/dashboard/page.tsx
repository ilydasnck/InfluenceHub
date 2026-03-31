"use client";

import { useI18n } from "@/lib/i18n/context";
import { Calendar, TrendingUp, Users, Zap } from "lucide-react";

export default function DashboardPage() {
  const { t } = useI18n();

  const stats = [
    {
      label: t("dashboard.stats.connectedAccounts"),
      hint: t("dashboard.stats.connectedAccountsHint"),
      value: "3",
      icon: Users,
    },
    {
      label: t("dashboard.stats.publishedPosts"),
      hint: t("dashboard.stats.publishedPostsHint"),
      value: "15",
      icon: TrendingUp,
    },
    {
      label: t("dashboard.stats.scheduledPosts"),
      hint: t("dashboard.stats.scheduledPostsHint"),
      value: "5",
      icon: Calendar,
    },
    {
      label: t("dashboard.stats.avgEngagement"),
      hint: t("dashboard.stats.avgEngagementHint"),
      value: "707",
      icon: Zap,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("dashboard.title")}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{t("dashboard.subtitle")}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400">{s.hint}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            {t("dashboard.charts.recentEngagement")}
          </h2>
          <div className="flex h-48 items-end justify-between gap-2 rounded-xl bg-slate-50 px-4 pb-2 pt-8 dark:bg-slate-800/50">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="w-full max-w-[14%] rounded-t bg-blue-500 dark:bg-blue-600"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            {t("dashboard.charts.aiTimes")}
          </h2>
          <ul className="space-y-3">
            {[1, 2, 3].map((i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {t("dashboard.charts.sampleTime")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("dashboard.charts.sampleDesc")}
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {t("dashboard.charts.samplePct")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
