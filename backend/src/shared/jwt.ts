import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  readonly sub: string;
  readonly email: string;
}

export function signAuthToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tanımlı değil");
  }
  return jwt.sign({ sub: userId, email }, secret, { expiresIn: "7d" });
}

/** İstemci `admin` / `admin` ile girişte kullanılır; .env ile değiştirilebilir */
const DEFAULT_LOCAL_ADMIN_TOKEN = "influencehub_local_admin_dev";

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const localToken = process.env.LOCAL_ADMIN_TOKEN ?? DEFAULT_LOCAL_ADMIN_TOKEN;
  if (token === localToken) {
    return {
      sub: "00000000-0000-0000-0000-000000000001",
      email: "admin@local",
    };
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch {
    return null;
  }
}
