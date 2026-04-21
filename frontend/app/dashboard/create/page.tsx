"use client";

import { ActionCard } from "@/components/create/ActionCard";
import { HistoryCard } from "@/components/create/HistoryCard";
import { MediaPickerCard } from "@/components/create/MediaPickerCard";
import { PostDetailsCard } from "@/components/create/PostDetailsCard";
import { ScheduleCard } from "@/components/create/ScheduleCard";
import { SelectAccountsCard } from "@/components/create/SelectAccountsCard";
import { CreateAccountOption, CreateMediaItem, CreatePostHistoryItem } from "@/components/create/types";
import { getApiBase, getStoredToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type AccountsApiResponse = {
  data: {
    groups: Array<{
      accounts: Array<{
        id: string;
        kind: "instagram" | "facebook" | "social";
        platform: string;
        displayName: string;
        handle: string;
      }>;
    }>;
  };
};

async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  let binary = "";
  const chunkSize = 0x8000;
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function parseApiResponse(res: Response): Promise<{ error?: string; data?: { message?: string } }> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }
  return (await res.json()) as { error?: string; data?: { message?: string } };
}

export default function CreatePostPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [accounts, setAccounts] = useState<CreateAccountOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<CreatePostHistoryItem[]>([]);
  const [media, setMedia] = useState<CreateMediaItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingNow, setLoadingNow] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTargets = useMemo(
    () =>
      accounts
        .filter((a) => selectedIds.includes(a.id))
        .map((a) => ({ accountId: a.id, kind: a.kind })),
    [accounts, selectedIds],
  );

  const loadAccounts = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoadingAccounts(true);
    try {
      const res = await fetch(`${getApiBase()}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as AccountsApiResponse;
      if (!res.ok) {
        setAccounts([]);
        return;
      }
      const flat = json.data.groups.flatMap((g) => g.accounts);
      setAccounts(
        flat.map((a) => ({
          id: a.id,
          kind: a.kind,
          platform: a.platform,
          label: a.displayName,
          handle: a.handle,
        })),
      );
    } finally {
      setLoadingAccounts(false);
    }
  }, [router]);

  const loadHistory = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const res = await fetch(`${getApiBase()}/api/posts/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as { data?: CreatePostHistoryItem[] };
    if (res.ok && json.data) {
      setHistory(json.data);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadHistory();
  }, [loadAccounts, loadHistory]);

  function toggleAccount(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function validate(mode: "now" | "schedule"): boolean {
    const next: Record<string, string> = {};
    if (!caption.trim() && !title.trim()) {
      next.content = t("create.errors.contentRequired");
    }
    if (selectedTargets.length < 1) {
      next.accounts = t("create.errors.accountRequired");
    }
    const hasInstagram = selectedTargets.some((tgt) => tgt.kind === "instagram");
    if (hasInstagram && media.length === 0) {
      next.media = t("create.errors.mediaRequiredInstagram");
    }
    if (mode === "schedule") {
      if (!date || !time) {
        next.schedule = t("create.errors.scheduleRequired");
      } else {
        const when = new Date(`${date}T${time}:00`);
        if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
          next.schedule = t("create.errors.scheduleFuture");
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function publishNow() {
    if (!validate("now")) return;
    const token = getStoredToken();
    if (!token) return;

    setLoadingNow(true);
    setMessage(null);
    try {
      const mediaPayload =
        media.length > 0
          ? await Promise.all(
              media.map(async (m) => ({
                name: m.file.name,
                mimeType: m.file.type,
                base64: await fileToBase64(m.file),
              })),
            )
          : [];
      const res = await fetch(`${getApiBase()}/api/posts/publish-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          caption,
          hashtags,
          mediaType: media[0]?.kind === "video" ? "VIDEO" : media[0]?.kind === "image" ? "IMAGE" : null,
          media: mediaPayload[0] ?? null,
          medias: mediaPayload,
          targets: selectedTargets,
        }),
      });
      const json = await parseApiResponse(res);
      if (!res.ok) {
        setMessageType("error");
        if (res.status === 413) {
          setMessage(t("create.feedback.tooLarge"));
        } else {
          setMessage(json.error ?? t("create.feedback.error"));
        }
        return;
      }
      setMessageType("success");
      setMessage(json.data?.message ?? t("create.feedback.published"));
      setTitle("");
      setCaption("");
      setHashtags("");
      setMedia([]);
      await loadHistory();
    } catch {
      setMessageType("error");
      setMessage(t("create.feedback.network"));
    } finally {
      setLoadingNow(false);
    }
  }

  async function schedulePost() {
    if (!validate("schedule")) return;
    const token = getStoredToken();
    if (!token) return;

    setLoadingSchedule(true);
    setMessage(null);
    try {
      const mediaPayload =
        media.length > 0
          ? await Promise.all(
              media.map(async (m) => ({
                name: m.file.name,
                mimeType: m.file.type,
                base64: await fileToBase64(m.file),
              })),
            )
          : [];
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch(`${getApiBase()}/api/posts/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          caption,
          hashtags,
          mediaType: media[0]?.kind === "video" ? "VIDEO" : media[0]?.kind === "image" ? "IMAGE" : null,
          media: mediaPayload[0] ?? null,
          medias: mediaPayload,
          scheduledAt,
          targets: selectedTargets,
        }),
      });
      const json = await parseApiResponse(res);
      if (!res.ok) {
        setMessageType("error");
        if (res.status === 413) {
          setMessage(t("create.feedback.tooLarge"));
        } else {
          setMessage(json.error ?? t("create.feedback.error"));
        }
        return;
      }
      setMessageType("success");
      setMessage(json.data?.message ?? t("create.feedback.scheduled"));
      await loadHistory();
    } catch {
      setMessageType("error");
      setMessage(t("create.feedback.network"));
    } finally {
      setLoadingSchedule(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("create.title")}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{t("create.subtitle")}</p>

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            messageType === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PostDetailsCard
            title={t("create.sections.details")}
            subtitle={t("create.sections.detailsSub")}
            valueTitle={title}
            valueCaption={caption}
            valueHashtags={hashtags}
            onTitleChange={setTitle}
            onCaptionChange={setCaption}
            onHashtagsChange={setHashtags}
            errors={errors}
            labels={{
              postTitle: t("create.fields.title"),
              caption: t("create.fields.caption"),
              hashtags: t("create.fields.hashtags"),
              titlePlaceholder: t("create.fields.titlePlaceholder"),
              captionPlaceholder: t("create.fields.captionPlaceholder"),
              hashtagsPlaceholder: t("create.fields.hashtagsPlaceholder"),
            }}
          />

          <MediaPickerCard
            title={t("create.sections.media")}
            subtitle={t("create.sections.mediaSub")}
            selectLabel={t("create.media.select")}
            removeLabel={t("create.media.remove")}
            hint={t("create.media.hint")}
            media={media}
            error={errors.media}
            onPick={(files) => {
              if (!files || files.length === 0) {
                setMedia([]);
                return;
              }
              const picked = Array.from(files);
              const invalid = picked.find((file) => !file.type.startsWith("video/") && !file.type.startsWith("image/"));
              if (invalid) {
                setErrors((prev) => ({ ...prev, media: t("create.errors.mediaType") }));
                return;
              }
              setErrors((prev) => ({ ...prev, media: "" }));
              setMedia(
                picked.map((file) => ({
                  file,
                  kind: file.type.startsWith("video/") ? "video" : "image",
                })),
              );
            }}
            onRemoveAt={(index) => setMedia((prev) => prev.filter((_, i) => i !== index))}
          />

          <ScheduleCard
            title={t("create.sections.schedule")}
            subtitle={t("create.sections.scheduleSub")}
            dateLabel={t("create.fields.date")}
            timeLabel={t("create.fields.time")}
            dateValue={date}
            timeValue={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            error={errors.schedule}
          />

          <HistoryCard
            title={t("create.sections.history")}
            empty={t("create.history.empty")}
            items={history}
            statusMap={{
              SCHEDULED: t("create.status.scheduled"),
              PROCESSING: t("create.status.processing"),
              SUCCESS: t("create.status.success"),
              FAILED: t("create.status.failed"),
              PARTIAL: t("create.status.partial"),
            }}
            labels={{
              when: t("create.history.when"),
              accounts: t("create.history.accounts"),
            }}
          />
        </div>

        <div className="space-y-6">
          <SelectAccountsCard
            title={t("create.sections.accounts")}
            subtitle={t("create.sections.accountsSub")}
            emptyTitle={loadingAccounts ? t("create.loadingAccounts") : t("create.emptyAccounts")}
            emptyDesc={t("create.emptyAccountsSub")}
            goAccounts={t("create.goAccounts")}
            accounts={accounts}
            selectedIds={selectedIds}
            onToggle={toggleAccount}
            error={errors.accounts}
          />

          <ActionCard
            title={t("create.sections.actions")}
            publishNowLabel={t("create.actions.publishNow")}
            scheduleLabel={t("create.actions.schedule")}
            loadingNow={loadingNow}
            loadingSchedule={loadingSchedule}
            onPublishNow={() => void publishNow()}
            onSchedule={() => void schedulePost()}
          />
        </div>
      </div>
    </div>
  );
}
