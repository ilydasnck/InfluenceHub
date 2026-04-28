import { getApiBase } from '../../config/api';
import { getSessionToken } from './auth';

export type PlatformId = 'instagram' | 'facebook' | 'youtube' | 'tiktok';

export type AccountKind = 'instagram' | 'facebook' | 'social';

export interface AccountRow {
  id: string;
  kind: AccountKind;
  platform: string;
  displayName: string;
  handle: string;
  followerCount: number;
  avatarUrl: string | null;
  weeklyDelta?: number | null;
}

export interface AccountGroup {
  platform: PlatformId;
  accounts: AccountRow[];
  countLabel: number;
}

export interface AccountsStats {
  totalAccounts: number;
  totalFollowers: number;
  platformCount: number;
}

export interface AccountsResponse {
  data: {
    stats: AccountsStats;
    groups: AccountGroup[];
    growth?: unknown;
  };
}

export type AccountsResult =
  | { ok: true; data: AccountsResponse['data'] }
  | { ok: false; error: string; missingAuth?: boolean };

export async function fetchAccounts(opts?: {
  refresh?: boolean;
}): Promise<AccountsResult> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok', missingAuth: true };
  }

  try {
    const qs = opts?.refresh ? '?refresh=1' : '';
    const res = await fetch(`${getApiBase()}/api/accounts${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const raw = await res.text();
      const parsed = safeJson(raw) as { error?: string } | null;
      return {
        ok: false,
        error:
          parsed && typeof parsed.error === 'string'
            ? parsed.error
            : `Hesaplar yüklenemedi (${res.status})`,
      };
    }
    const json = (await res.json()) as AccountsResponse;
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

export interface ConnectStartResult {
  ok: boolean;
  oauthUrl?: string;
  error?: string;
}

export async function startConnect(
  platform: PlatformId,
): Promise<ConnectStartResult> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok' };
  }
  try {
    const res = await fetch(`${getApiBase()}/api/accounts/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ platform }),
    });
    const raw = await res.text();
    const parsed = safeJson(raw) as
      | { data?: { oauthUrl?: string }; error?: string }
      | null;
    if (!res.ok) {
      return {
        ok: false,
        error:
          parsed && typeof parsed.error === 'string'
            ? parsed.error
            : `İstek başarısız (${res.status})`,
      };
    }
    return { ok: true, oauthUrl: parsed?.data?.oauthUrl };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

export async function removeAccount(account: AccountRow): Promise<{
  ok: boolean;
  error?: string;
}> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok' };
  }
  const kind = account.kind;
  try {
    const res = await fetch(
      `${getApiBase()}/api/accounts/${encodeURIComponent(account.id)}?kind=${kind}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      return { ok: false, error: `Silinemedi (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

function safeJson(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
