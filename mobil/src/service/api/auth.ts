import { getApiBase } from '../../config/api';

/** Sadece bellekte tutulur; uygulama kapanınca silinir. */
let sessionToken: string | null = null;

export type AuthResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/** Geri uyumluluk */
export type LoginResult = AuthResult;

async function postAuth(
  path: '/api/auth/login' | '/api/auth/register',
  body: Record<string, unknown>,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await res.text();

    let data: { data?: { token?: string }; error?: string };
    try {
      data = raw ? (JSON.parse(raw) as typeof data) : {};
    } catch {
      if (__DEV__) {
        console.warn('[auth] JSON parse hatası', res.status, raw.slice(0, 200));
      }
      return { ok: false, error: `Sunucu yanıtı okunamadı (${res.status}).` };
    }

    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof data.error === 'string' ? data.error : 'İstek başarısız',
      };
    }

    const token = data.data?.token;
    if (typeof token !== 'string' || !token) {
      return { ok: false, error: 'Sunucu token göndermedi' };
    }

    sessionToken = token;
    return { ok: true, token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (__DEV__) {
      console.warn('[auth] fetch', msg);
    }
    return {
      ok: false,
      error:
        'Bağlantı kurulamadı. mobil/src/config/api.ts adresini ve ağı kontrol edin.',
    };
  }
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AuthResult> {
  return postAuth('/api/auth/login', { email: email.trim(), password });
}

export async function registerWithCredentials(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResult> {
  const body: Record<string, unknown> = {
    email: email.trim(),
    password,
  };
  if (name && name.trim()) {
    body.name = name.trim();
  }
  return postAuth('/api/auth/register', body);
}

/** Bellekteki oturum token'ını döner; uygulama kapanınca temizlenir. */
export function getSessionToken(): string | null {
  return sessionToken;
}

export function clearSessionToken(): void {
  sessionToken = null;
}

const LOCAL_ADMIN_TOKEN = 'influencehub_local_admin_dev';

export function isLocalAdminToken(token: string | null | undefined): boolean {
  return token === LOCAL_ADMIN_TOKEN;
}

export interface JwtPayload {
  email?: string;
  sub?: string;
}

/** Native modülsüz basit JWT payload çözümü (imza doğrulamaz). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const atobFn = (
      globalThis as unknown as { atob?: (s: string) => string }
    ).atob;
    const json =
      typeof atobFn === 'function' ? atobFn(padded) : decodeBase64(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(input: string): string {
  const str = input.replace(/=+$/, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const value = BASE64_CHARS.indexOf(str.charAt(i));
    if (value < 0) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}
