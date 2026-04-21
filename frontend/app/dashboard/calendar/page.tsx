"use client";

import { getApiBase, getStoredToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string | null;
  caption: string;
  scheduledAt: string | null;
  targets: Array<{ accountLabel: string | null; platform: string }>;
};

export default function CalendarPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getStoredToken();
      if (!token) return;
      try {
        const res = await fetch(`${getApiBase()}/api/posts/scheduled`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { data?: Item[] };
        if (res.ok && json.data) {
          setItems(json.data);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("calendar.title")}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{t("calendar.subtitle")}</p>

      {loading && <p className="mt-4 text-sm text-slate-500">{t("calendar.loading")}</p>}

      {!loading && items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
          {t("calendar.empty")}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title || item.caption}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("calendar.when")}: {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "-"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("calendar.accounts")}: {item.targets.map((tgt) => tgt.accountLabel || tgt.platform).join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
