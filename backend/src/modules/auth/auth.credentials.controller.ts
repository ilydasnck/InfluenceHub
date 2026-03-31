import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { getDatabase } from "../../shared/database";
import { signAuthToken } from "../../shared/jwt";

const MIN_PASSWORD_LEN = 8;
const SALT_ROUNDS = 10;

function requireJwtSecret(res: Response): boolean {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ error: "Sunucu yapılandırması eksik (JWT_SECRET)" });
    return false;
  }
  return true;
}

export async function handleRegister(req: Request, res: Response): Promise<void> {
  if (!requireJwtSecret(res)) {
    return;
  }

  const body = req.body as { email?: unknown; password?: unknown; name?: unknown };
  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;

  if (!emailRaw || !password) {
    res.status(400).json({ error: "E-posta ve şifre gerekli" });
    return;
  }
  if (password.length < MIN_PASSWORD_LEN) {
    res.status(400).json({ error: `Şifre en az ${MIN_PASSWORD_LEN} karakter olmalı` });
    return;
  }

  const db = getDatabase();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await db.user.create({
      data: {
        email: emailRaw,
        password: passwordHash,
        ...(name ? { name } : {}),
      },
    });
    const token = signAuthToken(user.id, user.email);
    res.status(201).json({ data: { token } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı" });
      return;
    }
    throw e;
  }
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  if (!requireJwtSecret(res)) {
    return;
  }

  const body = req.body as { email?: unknown; password?: unknown };
  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!emailRaw || !password) {
    res.status(400).json({ error: "E-posta ve şifre gerekli" });
    return;
  }

  const db = getDatabase();
  const user = await db.user.findUnique({ where: { email: emailRaw } });

  if (!user) {
    res.status(401).json({ error: "E-posta veya şifre hatalı" });
    return;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    res.status(401).json({ error: "E-posta veya şifre hatalı" });
    return;
  }

  const token = signAuthToken(user.id, user.email);
  res.status(200).json({ data: { token } });
}
