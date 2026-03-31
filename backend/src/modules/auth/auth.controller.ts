import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuthConfig } from "./auth.types";
import { AuthService } from "./auth.service";
import { logger } from "../../shared/logger";
import { verifyAuthToken } from "../../shared/jwt";

const getOAuthConfig = (): OAuthConfig | null => {
  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!facebookAppId || !facebookAppSecret || !redirectUri) {
    return null;
  }

  return { facebookAppId, facebookAppSecret, redirectUri };
};

/** Facebook Sayfa OAuth — ayrı yönlendirme URI (Meta uygulamasına ekleyin) */
const getFacebookOAuthConfig = (): OAuthConfig | null => {
  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_OAUTH_REDIRECT_URI;

  if (!facebookAppId || !facebookAppSecret || !redirectUri) {
    return null;
  }

  return { facebookAppId, facebookAppSecret, redirectUri };
};

function getBearerOrQueryToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  const q = req.query.token;
  if (typeof q === "string") {
    return q;
  }
  if (Array.isArray(q) && q[0]) {
    return String(q[0]);
  }
  return null;
}

export const createAuthController = (service: AuthService) => ({
  async handleRedirect(req: Request, res: Response): Promise<void> {
    const config = getOAuthConfig();
    if (!config) {
      res.status(500).json({ error: "OAuth yapılandırması eksik" });
      return;
    }

    const token = getBearerOrQueryToken(req);
    if (!token) {
      res.status(401).json({ error: "Yetkisiz — giriş token'ı gerekli (?token= veya Authorization)" });
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      res.status(401).json({ error: "Geçersiz veya süresi dolmuş oturum" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT yapılandırması eksik" });
      return;
    }

    const state = jwt.sign({ sub: payload.sub }, secret, { expiresIn: "10m" });
    const authUrl = service.buildAuthorizationUrl(config, state);
    logger.info("Instagram OAuth yönlendirmesi yapılıyor", "AuthController");
    res.redirect(authUrl);
  },

  async handleCallback(req: Request, res: Response): Promise<void> {
    const config = getOAuthConfig();
    if (!config) {
      res.status(500).json({ error: "OAuth yapılandırması eksik" });
      return;
    }

    const code = Array.isArray(req.query.code)
      ? String(req.query.code[0])
      : String(req.query.code ?? "");

    if (!code) {
      res.status(400).json({ error: "OAuth code parametresi eksik" });
      return;
    }

    const stateRaw = Array.isArray(req.query.state)
      ? req.query.state[0]
      : req.query.state;
    const state = stateRaw != null ? String(stateRaw) : "";

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT yapılandırması eksik" });
      return;
    }

    let userId: string;
    try {
      const decoded = jwt.verify(state, secret) as { sub?: string };
      if (!decoded.sub) {
        throw new Error("state içinde kullanıcı yok");
      }
      userId = decoded.sub;
    } catch {
      res.status(400).json({ error: "Geçersiz veya süresi dolmuş OAuth state" });
      return;
    }

    const result = await service.handleCallback(config, { code, userId });

    if (!result.ok) {
      logger.error(
        `OAuth callback başarısız: ${result.error.message}`,
        "AuthController",
      );
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }

    const frontend =
      process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3005";
    res.redirect(
      `${frontend}/dashboard/accounts?connected=instagram`,
    );
  },

  async handleFacebookRedirect(req: Request, res: Response): Promise<void> {
    const config = getFacebookOAuthConfig();
    if (!config) {
      res.status(500).json({
        error:
          "Facebook OAuth yapılandırması eksik (FACEBOOK_OAUTH_REDIRECT_URI ve Meta uygulama ayarları)",
      });
      return;
    }

    const token = getBearerOrQueryToken(req);
    if (!token) {
      res.status(401).json({
        error: "Yetkisiz — giriş token'ı gerekli (?token= veya Authorization)",
      });
      return;
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      res.status(401).json({ error: "Geçersiz veya süresi dolmuş oturum" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT yapılandırması eksik" });
      return;
    }

    const state = jwt.sign({ sub: payload.sub }, secret, { expiresIn: "10m" });
    const authUrl = service.buildFacebookPageAuthorizationUrl(config, state);
    logger.info("Facebook Sayfa OAuth yönlendirmesi yapılıyor", "AuthController");
    res.redirect(authUrl);
  },

  async handleFacebookCallback(req: Request, res: Response): Promise<void> {
    const config = getFacebookOAuthConfig();
    if (!config) {
      res.status(500).json({ error: "Facebook OAuth yapılandırması eksik" });
      return;
    }

    const code = Array.isArray(req.query.code)
      ? String(req.query.code[0])
      : String(req.query.code ?? "");

    if (!code) {
      res.status(400).json({ error: "OAuth code parametresi eksik" });
      return;
    }

    const stateRaw = Array.isArray(req.query.state)
      ? req.query.state[0]
      : req.query.state;
    const state = stateRaw != null ? String(stateRaw) : "";

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT yapılandırması eksik" });
      return;
    }

    let userId: string;
    try {
      const decoded = jwt.verify(state, secret) as { sub?: string };
      if (!decoded.sub) {
        throw new Error("state içinde kullanıcı yok");
      }
      userId = decoded.sub;
    } catch {
      res.status(400).json({ error: "Geçersiz veya süresi dolmuş OAuth state" });
      return;
    }

    const result = await service.handleFacebookPagesOAuth(config, {
      code,
      userId,
      redirectUri: config.redirectUri,
    });

    if (!result.ok) {
      logger.error(
        `Facebook OAuth callback başarısız: ${result.error.message}`,
        "AuthController",
      );
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }

    const frontend =
      process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3005";
    res.redirect(`${frontend}/dashboard/accounts?connected=facebook`);
  },

  async handleGetAccount(req: Request, res: Response): Promise<void> {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const result = await service.getAccountByUserId(userId);

    if (!result.ok) {
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }

    res.status(200).json({ data: result.value });
  },
});

export type AuthController = ReturnType<typeof createAuthController>;
