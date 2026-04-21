"use client";

import {
  AccountOption,
  CalendarBoard,
  CalendarEvent,
  EditablePost,
  PlannedListSection,
  PostDetailModal,
} from "@/components/calendar";
import { getApiBase, getStoredToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { useCallback, useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  title: string | null;
  caption: string;
  hashtags?: string | null;
  status: "SCHEDULED" | "PROCESSING" | "SUCCESS" | "FAILED" | "PARTIAL";
  scheduledAt: string | null;
  createdAt: string;
  publishedAt: string | null;
  targets: Array<{
    accountId: string;
    kind: "instagram" | "facebook" | "social";
    accountLabel: string | null;
    platform: string;
  }>;
};

type AccountsApiResponse = {
  data: {
    groups: Array<{
      accounts: Array<{
        id: string;
        kind: "instagram" | "facebook" | "social";
        displayName: string;
        platform: string;
      }>;
    }>;
  };
};

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const [scheduledItems, setScheduledItems] = useState<Item[]>([]);
  const [historyItems, setHistoryItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountKinds, setAccountKinds] = useState<Record<string, "instagram" | "facebook" | "social">>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [activeModal, setActiveModal] = useState<EditablePost | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAllPublished, setShowAllPublished] = useState(false);

  const loadAll = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      const [scheduledRes, historyRes, accountsRes] = await Promise.all([
        fetch(`${getApiBase()}/api/posts/scheduled`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiBase()}/api/posts/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiBase()}/api/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const scheduledJson = (await scheduledRes.json()) as { data?: Item[] };
      const historyJson = (await historyRes.json()) as { data?: Item[] };
      const accountsJson = (await accountsRes.json()) as AccountsApiResponse;
      if (scheduledRes.ok && scheduledJson.data) setScheduledItems(scheduledJson.data);
      if (historyRes.ok && historyJson.data) setHistoryItems(historyJson.data);
      if (accountsRes.ok) {
        const flat = accountsJson.data.groups.flatMap((g) => g.accounts);
        setAccounts(flat.map((x) => ({ id: x.id, label: `${x.displayName} (${x.platform})` })));
        setAccountKinds(
          flat.reduce(
            (acc, x) => {
              acc[x.id] = x.kind;
              return acc;
            },
            {} as Record<string, "instagram" | "facebook" | "social">,
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      scheduledItems
        .filter((item) => Boolean(item.scheduledAt))
        .map((item) => {
          const start = new Date(item.scheduledAt as string);
          const end = new Date(start.getTime() + 30 * 60 * 1000);
          return {
            title: item.title || item.caption || "Post",
            start,
            end,
            resource: { id: item.id, status: item.status },
          } as CalendarEvent;
        }),
    [scheduledItems],
  );

  const scheduledAndPublishedItems = useMemo(() => {
    const rows = historyItems
      .filter((x) => Boolean(x.scheduledAt) && Boolean(x.publishedAt))
      .sort((a, b) => {
        const aTime = new Date(a.publishedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.publishedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });
    return showAllPublished ? rows : rows.slice(0, 5);
  }, [historyItems, showAllPublished]);

  function toDateTimeLocal(dateValue: string | null) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function updatePost(payload: EditablePost) {
    const token = getStoredToken();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/posts/${payload.id}/scheduled`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: payload.title,
          caption: payload.caption,
          hashtags: payload.hashtags,
          scheduledAt: new Date(payload.scheduledAt).toISOString(),
          targets: payload.selectedTargetIds.map((id) => ({
            accountId: id,
            kind: accountKinds[id],
          })),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessageType("error");
        setMessage(json.error ?? t("calendar.updateError"));
        return;
      }
      setMessageType("success");
      setMessage(t("calendar.updated"));
      setActiveModal(null);
      await loadAll();
    } catch {
      setMessageType("error");
      setMessage(t("calendar.updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(postId: string) {
    const token = getStoredToken();
    if (!token) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`${getApiBase()}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessageType("error");
        setMessage(json.error ?? t("calendar.deleteError"));
        return;
      }
      setMessageType("success");
      setMessage(t("calendar.deleted"));
      setActiveModal(null);
      await loadAll();
    } catch {
      setMessageType("error");
      setMessage(t("calendar.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  async function onMoveEvent(event: CalendarEvent, start: Date, end: Date) {
    const item = scheduledItems.find((x) => x.id === event.resource.id);
    if (!item) return;
    await updatePost({
      id: item.id,
      title: item.title ?? "",
      caption: item.caption,
      hashtags: item.hashtags ?? "",
      scheduledAt: toDateTimeLocal(start.toISOString()),
      selectedTargetIds: item.targets.map((target) => target.accountId),
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        {t("calendar.title")}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {t("calendar.subtitle")}
      </p>
      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            messageType === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </p>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">{t("calendar.loading")}</p>
      )}

      {!loading && scheduledItems.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
          {t("calendar.empty")}
        </p>
      )}

      {!loading && (
        <div className="mt-4 space-y-6">
          <CalendarBoard
            locale={locale}
            events={calendarEvents}
            onSelectEvent={(event) => {
              const item = scheduledItems.find((x) => x.id === event.resource.id);
              if (!item) return;
              setActiveModal({
                id: item.id,
                title: item.title ?? "",
                caption: item.caption,
                hashtags: item.hashtags ?? "",
                scheduledAt: toDateTimeLocal(item.scheduledAt),
                selectedTargetIds: item.targets.map((target) => target.accountId),
              });
            }}
            onMoveEvent={onMoveEvent}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <PlannedListSection
              title={t("calendar.sections.planned")}
              empty={t("calendar.empty")}
              items={scheduledItems.map((item) => ({
                id: item.id,
                title: item.title || item.caption,
                subtitle: `${t("calendar.when")}: ${item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "-"}`,
                status: item.status,
              }))}
            />
            <PlannedListSection
              title={t("calendar.sections.history")}
              empty={t("create.history.empty")}
              items={scheduledAndPublishedItems.map((item) => ({
                id: item.id,
                title: item.title || item.caption,
                subtitle: `${t("calendar.when")}: ${item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}`,
                status: item.status,
              }))}
            />
          </div>
          {historyItems.filter((x) => Boolean(x.scheduledAt) && Boolean(x.publishedAt)).length > 5 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllPublished((prev) => !prev)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {showAllPublished ? t("calendar.showLess") : t("calendar.viewAll")}
              </button>
            </div>
          )}
        </div>
      )}

      <PostDetailModal
        open={Boolean(activeModal)}
        title={t("calendar.detailTitle")}
        closeLabel={t("accounts.modalClose")}
        deleteLabel={t("calendar.delete")}
        saveLabel={t("calendar.save")}
        labels={{
          title: t("create.fields.title"),
          caption: t("create.fields.caption"),
          hashtags: t("create.fields.hashtags"),
          scheduledAt: t("calendar.when"),
          targets: t("calendar.accounts"),
        }}
        value={activeModal}
        accounts={accounts}
        saving={saving}
        deleting={deleting}
        onClose={() => setActiveModal(null)}
        onChange={setActiveModal}
        onSave={() => activeModal && void updatePost(activeModal)}
        onDelete={() => activeModal && void deletePost(activeModal.id)}
      />
    </div>
  );
}
