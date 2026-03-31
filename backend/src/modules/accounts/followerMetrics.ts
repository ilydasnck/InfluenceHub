import type { PrismaClient } from "@prisma/client";

function startUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

export async function upsertDailySnapshots(
  db: PrismaClient,
  userId: string,
  entries: { kind: string; refId: string; count: number }[],
): Promise<void> {
  const dayStart = startUtcDay();
  const dayEnd = endUtcDay();

  for (const e of entries) {
    const existing = await db.followerSnapshot.findFirst({
      where: {
        userId,
        accountKind: e.kind,
        accountRefId: e.refId,
        recordedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      await db.followerSnapshot.update({
        where: { id: existing.id },
        data: { followerCount: e.count },
      });
    } else {
      await db.followerSnapshot.create({
        data: {
          userId,
          accountKind: e.kind,
          accountRefId: e.refId,
          followerCount: e.count,
        },
      });
    }
  }
}

async function followerCountAtOrBefore(
  db: PrismaClient,
  userId: string,
  kind: string,
  refId: string,
  cutoff: Date,
): Promise<number | null> {
  const snap = await db.followerSnapshot.findFirst({
    where: {
      userId,
      accountKind: kind,
      accountRefId: refId,
      recordedAt: { lte: cutoff },
    },
    orderBy: { recordedAt: "desc" },
  });
  return snap?.followerCount ?? null;
}

function deltaOrNull(current: number, past: number | null): number | null {
  if (past === null) {
    return null;
  }
  return current - past;
}

function utcDayKey(d: Date): string {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function endUtcDayFromKey(dayKey: string): number {
  return new Date(`${dayKey}T23:59:59.999Z`).getTime();
}

/** Son N gün (UTC) için bağlı hesapların toplam takipçi eğrisi — snapshot geçmişinden */
export async function computeFollowerTotalsSeries(
  db: PrismaClient,
  userId: string,
  accountKeys: { kind: string; refId: string }[],
  currentTotalsByRefId: Map<string, number>,
  maxDays: number,
): Promise<{ date: string; total: number }[]> {
  if (accountKeys.length === 0) {
    return [];
  }

  const snaps = await db.followerSnapshot.findMany({
    where: {
      userId,
      OR: accountKeys.map((k) => ({
        accountKind: k.kind,
        accountRefId: k.refId,
      })),
    },
    orderBy: { recordedAt: "asc" },
    take: 20000,
  });

  const todayKey = utcDayKey(new Date());
  const windowStart = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
  const windowStartKey = utcDayKey(windowStart);

  if (snaps.length === 0) {
    let total = 0;
    for (const k of accountKeys) {
      total += currentTotalsByRefId.get(k.refId) ?? 0;
    }
    return total > 0 ? [{ date: todayKey, total }] : [];
  }

  const byAcc = new Map<string, { t: number; c: number }[]>();
  for (const s of snaps) {
    const k = `${s.accountKind}:${s.accountRefId}`;
    if (!byAcc.has(k)) {
      byAcc.set(k, []);
    }
    byAcc.get(k)!.push({ t: s.recordedAt.getTime(), c: s.followerCount });
  }
  for (const arr of byAcc.values()) {
    arr.sort((a, b) => a.t - b.t);
  }

  function lastCountAtOrBefore(accKey: string, tEnd: number): number | null {
    const arr = byAcc.get(accKey);
    if (!arr?.length) {
      return null;
    }
    let lo = 0;
    let hi = arr.length - 1;
    let best: number | null = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].t <= tEnd) {
        best = arr[mid].c;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  }

  const firstSnapKey = utcDayKey(snaps[0].recordedAt);
  const startKey =
    windowStartKey > firstSnapKey ? windowStartKey : firstSnapKey;

  const series: { date: string; total: number }[] = [];
  const start = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${todayKey}T00:00:00.000Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayKey = utcDayKey(d);
    const dayEnd = endUtcDayFromKey(dayKey);
    let total = 0;
    for (const k of accountKeys) {
      const accKey = `${k.kind}:${k.refId}`;
      let c = lastCountAtOrBefore(accKey, dayEnd);
      if (c === null && dayKey === todayKey) {
        c = currentTotalsByRefId.get(k.refId) ?? null;
      }
      if (c !== null) {
        total += c;
      }
    }
    series.push({ date: dayKey, total });
  }

  return series;
}

export type AccountMetricInput = {
  id: string;
  kind: string;
  platform: string;
  displayName: string;
  followerCount: number;
};

export async function computeFollowerMetrics(
  db: PrismaClient,
  userId: string,
  accounts: AccountMetricInput[],
): Promise<{
  weeklyDeltas: Map<string, number | null>;
  growth: {
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
    /** UTC günü (YYYY-MM-DD) → tüm hesapların toplam takipçisi (snapshot birleşimi) */
    series: { date: string; total: number }[];
  };
}> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let net7 = 0;
  let hasAny7 = false;
  let net30 = 0;
  let hasAny30 = false;

  const weeklyDeltas = new Map<string, number | null>();

  for (const a of accounts) {
    const past7 = await followerCountAtOrBefore(
      db,
      userId,
      a.kind,
      a.id,
      weekAgo,
    );
    const past30 = await followerCountAtOrBefore(
      db,
      userId,
      a.kind,
      a.id,
      thirtyAgo,
    );

    const w7 = deltaOrNull(a.followerCount, past7);
    const w30 = deltaOrNull(a.followerCount, past30);

    weeklyDeltas.set(a.id, w7);

    if (w7 !== null) {
      net7 += w7;
      hasAny7 = true;
    }
    if (w30 !== null) {
      net30 += w30;
      hasAny30 = true;
    }
  }

  const totalFollowers = accounts.reduce((s, a) => s + a.followerCount, 0);

  const distribution = accounts.map((a) => ({
    accountId: a.id,
    kind: a.kind,
    platform: a.platform,
    label: a.displayName,
    followers: a.followerCount,
    sharePercent:
      totalFollowers > 0
        ? Math.round((a.followerCount / totalFollowers) * 1000) / 10
        : 0,
  }));

  const currentTotalsByRefId = new Map<string, number>();
  for (const a of accounts) {
    currentTotalsByRefId.set(a.id, a.followerCount);
  }

  const accountKeys = accounts.map((a) => ({ kind: a.kind, refId: a.id }));
  const series = await computeFollowerTotalsSeries(
    db,
    userId,
    accountKeys,
    currentTotalsByRefId,
    30,
  );

  return {
    weeklyDeltas,
    growth: {
      netFollowers7d: hasAny7 ? net7 : null,
      netFollowers30d: hasAny30 ? net30 : null,
      distribution,
      series,
    },
  };
}

export async function deleteSnapshotsForAccount(
  db: PrismaClient,
  userId: string,
  kind: string,
  refId: string,
): Promise<void> {
  await db.followerSnapshot.deleteMany({
    where: { userId, accountKind: kind, accountRefId: refId },
  });
}
