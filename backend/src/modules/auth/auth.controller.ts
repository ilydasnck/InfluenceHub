import { Request, Response } from "express";
import { OAuthConfig } from "./auth.types";
import { AuthService } from "./auth.service";
import { logger } from "../../shared/logger";

const getOAuthConfig = (): OAuthConfig | null => {
  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!facebookAppId || !facebookAppSecret || !redirectUri) {
    return null;
  }

  return { facebookAppId, facebookAppSecret, redirectUri };
};

export const createAuthController = (service: AuthService) => ({
  async handleRedirect(_req: Request, res: Response): Promise<void> {
    const config = getOAuthConfig();
    if (!config) {
      res.status(500).json({ error: "OAuth yapılandırması eksik" });
      return;
    }

    const authUrl = service.buildAuthorizationUrl(config);
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

    // TODO: Gerçek projede userId JWT/session'dan alınmalı
    const userId = Array.isArray(req.query.userId)
      ? String(req.query.userId[0])
      : String(req.query.userId ?? "");

    if (!userId) {
      res.status(400).json({ error: "userId parametresi eksik" });
      return;
    }

    const result = await service.handleCallback(config, { code, userId });

    if (!result.ok) {
      logger.error(`OAuth callback başarısız: ${result.error.message}`, "AuthController");
      res.status(result.error.code).json({ error: result.error.message });
      return;
    }

    res.status(200).json({ data: result.value });
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
