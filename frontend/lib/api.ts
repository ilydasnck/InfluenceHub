/**
 * İstemci tarafında boş string: istekler aynı origin'e gider (`/api/...`),
 * Next.js rewrite ile backend'e yönlendirilir (CORS / LAN sorunu olmaz).
 * `NEXT_PUBLIC_API_URL` açıkça verilmişse (özel kurulum) o kullanılır.
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const explicit = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (explicit) {
      return explicit;
    }
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:5000";
}

const TOKEN_KEY = "influencehub_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
