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

export function verifyAuthToken(token: string): AuthTokenPayload | null {
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
