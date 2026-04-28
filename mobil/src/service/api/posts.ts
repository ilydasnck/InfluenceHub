import { getApiBase } from '../../config/api';
import { getSessionToken } from './auth';
import type { AccountKind, PlatformId } from './accounts';

export interface PostTarget {
  accountId: string;
  kind: AccountKind;
}

export interface PostTargetResult {
  id: string;
  kind: AccountKind;
  platform: string;
  accountId: string;
  accountLabel: string | null;
  status: 'SCHEDULED' | 'SUCCESS' | 'FAILED';
  errorMessage: string | null;
  externalPostId: string | null;
  publishedAt: string | null;
}

export interface PostHistoryItem {
  id: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  status: 'SCHEDULED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  createdAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  targets: PostTargetResult[];
}

export interface MediaPayload {
  name: string;
  mimeType: string;
  base64: string;
}

export interface CreatePostInput {
  title?: string;
  caption: string;
  hashtags?: string;
  targets: PostTarget[];
  mediaType?: 'IMAGE' | 'VIDEO' | null;
  media?: MediaPayload | null;
  medias?: MediaPayload[];
}

export interface ScheduleInput extends CreatePostInput {
  scheduledAt: string;
}

export type PostsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; missingAuth?: boolean; status?: number };

interface SimpleAccount {
  id: string;
  kind: AccountKind;
  platform: PlatformId;
  displayName: string;
  handle: string;
}

export async function fetchSimpleAccounts(): Promise<
  PostsResult<SimpleAccount[]>
> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok', missingAuth: true };
  }
  try {
    const res = await fetch(`${getApiBase()}/api/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Hesaplar yüklenemedi (${res.status})`,
        status: res.status,
      };
    }
    const json = (await res.json()) as {
      data: {
        groups: Array<{
          accounts: SimpleAccount[];
        }>;
      };
    };
    const flat = json.data.groups.flatMap(g => g.accounts);
    return { ok: true, data: flat };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

export async function fetchHistory(): Promise<PostsResult<PostHistoryItem[]>> {
  return getJsonList('/api/posts/history');
}

export async function fetchScheduled(): Promise<
  PostsResult<PostHistoryItem[]>
> {
  return getJsonList('/api/posts/scheduled');
}

async function getJsonList(
  path: '/api/posts/history' | '/api/posts/scheduled',
): Promise<PostsResult<PostHistoryItem[]>> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok', missingAuth: true };
  }
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Veriler yüklenemedi (${res.status})`,
        status: res.status,
      };
    }
    const json = (await res.json()) as { data?: PostHistoryItem[] };
    return { ok: true, data: json.data ?? [] };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

export interface UpdateScheduledInput {
  title?: string;
  caption: string;
  hashtags?: string;
  scheduledAt: string;
  targets: PostTarget[];
}

export async function updateScheduledPost(
  postId: string,
  input: UpdateScheduledInput,
): Promise<PostsResult<{ message?: string }>> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok', missingAuth: true };
  }
  try {
    const res = await fetch(
      `${getApiBase()}/api/posts/${encodeURIComponent(postId)}/scheduled`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      },
    );
    const raw = await res.text();
    const parsed = safeJson(raw) as
      | { error?: string; data?: { message?: string } }
      | null;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          parsed && typeof parsed.error === 'string'
            ? parsed.error
            : `Güncellenemedi (${res.status})`,
      };
    }
    return { ok: true, data: parsed?.data ?? {} };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

export async function deleteScheduledPost(
  postId: string,
): Promise<PostsResult<{ message?: string }>> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok', missingAuth: true };
  }
  try {
    const res = await fetch(
      `${getApiBase()}/api/posts/${encodeURIComponent(postId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `Silinemedi (${res.status})`,
      };
    }
    return { ok: true, data: {} };
  } catch {
    return { ok: false, error: 'Ağ hatası — backend açık mı?' };
  }
}

export async function publishNow(
  input: CreatePostInput,
): Promise<PostsResult<{ message?: string }>> {
  return postJson('/api/posts/publish-now', input);
}

export async function schedulePost(
  input: ScheduleInput,
): Promise<PostsResult<{ message?: string }>> {
  return postJson('/api/posts/schedule', input);
}

async function postJson(
  path: '/api/posts/publish-now' | '/api/posts/schedule',
  body: unknown,
): Promise<PostsResult<{ message?: string }>> {
  const token = getSessionToken();
  if (!token) {
    return { ok: false, error: 'Oturum yok', missingAuth: true };
  }
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    const parsed = safeJson(raw) as
      | { error?: string; data?: { message?: string } }
      | null;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          parsed && typeof parsed.error === 'string'
            ? parsed.error
            : `İstek başarısız (${res.status})`,
      };
    }
    return { ok: true, data: parsed?.data ?? {} };
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
