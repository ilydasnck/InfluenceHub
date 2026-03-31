"use client";

import { AccountCard, type AccountRow } from "@/components/accounts/AccountCard";
import {
  GrowthInsights,
  type GrowthData,
} from "@/components/accounts/GrowthInsights";
import {
  ConnectAccountModal,
  type PlatformId,
} from "@/components/accounts/ConnectAccountModal";
import { StatsCard } from "@/components/accounts/StatsCard";
import { getApiBase, getAuthHeaders, getStoredToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { Grid3x3, Layers, Plus, RefreshCw, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

type ApiGroup = {
  platform: PlatformId;
  accounts: AccountRow[];
  countLabel: number;
};

type ApiResponse = {
  data: {
    stats: {
      totalAccounts: number;
      totalFollowers: number;
      platformCount: number;
    };
    groups: ApiGroup[];
    growth: GrowthData;
  };
};

function AccountsContent() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [stats, setStats] = useState<ApiResponse["data"]["stats"] | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const prevFollowersRef = useRef<Map<string, number>>(new Map());

  const attachRecentDeltas = useCallback((groups: ApiGroup[]): ApiGroup[] => {
    const seen = new Set<string>();
    const next = groups.map((g) => ({
      ...g,
      accounts: g.accounts.map((a) => {
        const key = `${a.kind}:${a.id}`;
        seen.add(key);
        const prev = prevFollowersRef.current.get(key);
        const recentDelta = prev !== undefined ? a.followerCount - prev : null;
        prevFollowersRef.current.set(key, a.followerCount);
        return { ...a, recentDelta };
      }),
    }));
    for (const k of [...prevFollowersRef.current.keys()]) {
      if (!seen.has(k)) {
        prevFollowersRef.current.delete(k);
      }
    }
    return next;
  }, []);

  const load = useCallback(
    async (opts?: { refresh?: boolean; silent?: boolean }) => {
      const token = getStoredToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const isRefresh = opts?.refresh === true;
      const silent = opts?.silent === true;

      if (isRefresh) {
        setRefreshing(true);
      } else if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const qs = isRefresh ? "?refresh=1" : "";
        const res = await fetch(`${getApiBase()}/api/accounts${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError(t("accounts.loadError"));
          return;
        }
        const json = (await res.json()) as ApiResponse;
        setGroups(attachRecentDeltas(json.data.groups));
        setStats(json.data.stats);
        setGrowth(json.data.growth ?? null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, t, attachRecentDeltas],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const c = searchParams.get("connected");
    if (c === "instagram" || c === "facebook") {
      void load();
      router.replace("/dashboard/accounts");
    }
  }, [searchParams, router, load]);

  async function handleConnect(platform: PlatformId) {
    const token = getStoredToken();
    if (!token) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (platform === "instagram") {
        const res = await fetch(`${getApiBase()}/api/accounts/connect`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ platform: "instagram" }),
        });
        const json = (await res.json()) as {
          data?: { oauthUrl?: string };
          error?: string;
        };
        if (!res.ok || !json.data?.oauthUrl) {
          setError(json.error ?? t("accounts.connectError"));
          setBusy(false);
          return;
        }
        window.location.href = `${json.data.oauthUrl}?token=${encodeURIComponent(token)}`;
        return;
      }

      if (platform === "facebook") {
        const res = await fetch(`${getApiBase()}/api/accounts/connect`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ platform: "facebook" }),
        });
        const json = (await res.json()) as {
          data?: { oauthUrl?: string };
          error?: string;
        };
        if (!res.ok || !json.data?.oauthUrl) {
          setError(json.error ?? t("accounts.connectError"));
          setBusy(false);
          return;
        }
        window.location.href = `${json.data.oauthUrl}?token=${encodeURIComponent(token)}`;
        return;
      }

      const res = await fetch(`${getApiBase()}/api/accounts/connect`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ platform }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? t("accounts.connectError"));
        setBusy(false);
        return;
      }
      setModalOpen(false);
      await load({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(account: AccountRow) {
    if (!window.confirm(t("accounts.removeConfirm"))) {
      return;
    }
    const token = getStoredToken();
    if (!token) {
      return;
    }
    const kind =
      account.kind === "instagram"
        ? "instagram"
        : account.kind === "facebook"
          ? "facebook"
          : "social";
    const res = await fetch(
      `${getApiBase()}/api/accounts/${encodeURIComponent(account.id)}?kind=${kind}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      setError(t("accounts.deleteError"));
      return;
    }
    await load({ silent: true });
  }

  const nf = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US");

  const weeklyByAccountId = useMemo(() => {
    const m: Record<string, number | null | undefined> = {};
    for (const g of groups) {
      for (const a of g.accounts) {
        m[a.id] = a.weeklyDelta;
      }
    }
    return m;
  }, [groups]);

  const platformModalItems: {
    id: PlatformId;
    label: string;
    sub: string;
    className: string;
  }[] = [
    {
      id: "instagram",
      label: t("accounts.platform.instagram"),
      sub: t("accounts.platform.instagramSub"),
      className:
        "bg-gradient-to-br from-pink-500 via-purple-600 to-amber-500 hover:opacity-95",
    },
    {
      id: "facebook",
      label: t("accounts.platform.facebook"),
      sub: t("accounts.platform.facebookSub"),
      className: "bg-gradient-to-br from-blue-600 to-blue-800 hover:opacity-95",
    },
    {
      id: "youtube",
      label: t("accounts.platform.youtube"),
      sub: t("accounts.platform.youtubeSub"),
      className: "bg-gradient-to-br from-red-600 to-red-900 hover:opacity-95",
    },
    {
      id: "tiktok",
      label: t("accounts.platform.tiktok"),
      sub: t("accounts.platform.tiktokSub"),
      className: "bg-gradient-to-br from-slate-800 to-slate-950 hover:opacity-95",
    },
  ];

  function accountCountLabel(count: number): string {
    if (count === 1) {
      return t("accounts.accountCountOne").replace("{count}", String(count));
    }
    return t("accounts.accountCountMany").replace("{count}", String(count));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("accounts.title")}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t("accounts.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void load({ refresh: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            title={t("accounts.refresh")}
            aria-label={t("accounts.refresh")}
            aria-busy={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 shrink-0 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            />
            {refreshing ? t("accounts.refreshing") : t("accounts.refresh")}
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("accounts.connect")}
          </button>
        </div>
      </div>

      {growth && (
        <GrowthInsights
          growth={growth}
          nf={nf}
          locale={locale}
          weeklyByAccountId={weeklyByAccountId}
          platformNames={{
            instagram: t("accounts.platform.instagram"),
            facebook: t("accounts.platform.facebook"),
            youtube: t("accounts.platform.youtube"),
            tiktok: t("accounts.platform.tiktok"),
          }}
          labels={{
            title: t("accounts.growth.title"),
            subtitle: t("accounts.growth.subtitle"),
            net7: t("accounts.growth.net7"),
            net30: t("accounts.growth.net30"),
            noData: t("accounts.growth.noData"),
            distributionTitle: t("accounts.growth.distributionTitle"),
            chartNetTitle: t("accounts.growth.chartNetTitle"),
            chartShareTitle: t("accounts.growth.chartShareTitle"),
            chartLineTitle: t("accounts.growth.chartLineTitle"),
            chartLineHint: t("accounts.growth.chartLineHint"),
            tableTitle: t("accounts.growth.tableTitle"),
            colAccount: t("accounts.growth.colAccount"),
            colPlatform: t("accounts.growth.colPlatform"),
            colFollowers: t("accounts.growth.colFollowers"),
            colShare: t("accounts.growth.colShare"),
            colWeekly: t("accounts.growth.colWeekly"),
            period7Short: t("accounts.growth.period7Short"),
            period30Short: t("accounts.growth.period30Short"),
            tooltipFollowers: t("accounts.growth.tooltipFollowers"),
            tooltipShare: t("accounts.growth.tooltipShare"),
            sortBy: t("accounts.growth.sortBy"),
            platformFallback: t("accounts.growth.platformFallback"),
          }}
        />
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {stats && (
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard
            label={t("accounts.stats.totalAccounts")}
            value={nf.format(stats.totalAccounts)}
            icon={<Layers className="h-16 w-16 text-slate-900 dark:text-white" strokeWidth={1.25} />}
          />
          <StatsCard
            label={t("accounts.stats.totalFollowers")}
            value={nf.format(stats.totalFollowers)}
            icon={<Users className="h-16 w-16 text-slate-900 dark:text-white" strokeWidth={1.25} />}
          />
          <StatsCard
            label={t("accounts.stats.platforms")}
            value={nf.format(stats.platformCount)}
            icon={<Grid3x3 className="h-16 w-16 text-slate-900 dark:text-white" strokeWidth={1.25} />}
          />
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("accounts.loading")}</p>
      )}

      {!loading && groups.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-slate-600 dark:text-slate-400">{t("accounts.empty")}</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("accounts.connect")}
          </button>
        </div>
      )}

      {!loading &&
        groups.map((g) => (
          <section key={g.platform} className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t(`accounts.group.${g.platform}`)}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {accountCountLabel(g.accounts.length)}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {g.accounts.map((a) => (
                <AccountCard
                  key={`${a.kind}-${a.id}`}
                  account={a}
                  followersLabel={t("accounts.followers")}
                  connectedLabel={t("accounts.connected")}
                  removeLabel={t("accounts.remove")}
                  weeklyHint={t("accounts.weeklyChange")}
                  recentHint={t("accounts.recentChange")}
                  onRemove={() => void handleRemove(a)}
                />
              ))}
            </div>
          </section>
        ))}

      <ConnectAccountModal
        open={modalOpen}
        title={t("accounts.modalTitle")}
        closeLabel={t("accounts.modalClose")}
        platforms={platformModalItems}
        onClose={() => setModalOpen(false)}
        onSelect={(p) => void handleConnect(p)}
        busy={busy}
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">…</div>}>
      <AccountsContent />
    </Suspense>
  );
}
