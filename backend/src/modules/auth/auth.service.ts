import { Result } from "../../shared/result";
import { HttpClient } from "../../shared/httpClient";
import { logger } from "../../shared/logger";
import { PrismaClient } from "@prisma/client";
import {
  OAuthConfig,
  FacebookTokenResponse,
  FacebookPagesResponse,
  InstagramBusinessAccountResponse,
  ConnectedAccount,
  OAuthCallbackParams,
} from "./auth.types";

const OAUTH_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_read_engagement",
  "pages_show_list",
].join(",");

const LONG_LIVED_TOKEN_DAYS = 60;

interface AuthServiceError {
  readonly message: string;
  readonly code: number;
}

export const createAuthService = (
  facebookClient: HttpClient,
  db: PrismaClient,
) => ({
  buildAuthorizationUrl(config: OAuthConfig): string {
    const params = new URLSearchParams({
      client_id: config.facebookAppId,
      redirect_uri: config.redirectUri,
      scope: OAUTH_SCOPES,
      response_type: "code",
    });
    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  },

  async handleCallback(
    config: OAuthConfig,
    params: OAuthCallbackParams,
  ): Promise<Result<ConnectedAccount, AuthServiceError>> {
    logger.info("OAuth callback işleniyor", "AuthService");

    const shortTokenResult = await this.exchangeCodeForToken(config, params.code);
    if (!shortTokenResult.ok) return shortTokenResult;

    const longTokenResult = await this.exchangeForLongLivedToken(
      config,
      shortTokenResult.value,
    );
    if (!longTokenResult.ok) return longTokenResult;

    const longLivedToken = longTokenResult.value;

    const accountResult = await this.fetchInstagramBusinessAccount(longLivedToken);
    if (!accountResult.ok) return accountResult;

    const { businessAccountId, instagramUserId } = accountResult.value;

    const tokenExpiresAt = new Date(
      Date.now() + LONG_LIVED_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );

    const saved = await db.instagramAccount.upsert({
      where: {
        userId_instagramUserId: {
          userId: params.userId,
          instagramUserId,
        },
      },
      update: {
        accessToken: longLivedToken,
        businessAccountId,
        tokenExpiresAt,
      },
      create: {
        userId: params.userId,
        instagramUserId,
        businessAccountId,
        accessToken: longLivedToken,
        tokenExpiresAt,
      },
    });

    logger.info(`Instagram hesabı bağlandı: ${saved.id}`, "AuthService");

    return Result.ok({
      id: saved.id,
      instagramUserId: saved.instagramUserId,
      businessAccountId: saved.businessAccountId,
      tokenExpiresAt: saved.tokenExpiresAt,
    });
  },

  async exchangeCodeForToken(
    config: OAuthConfig,
    code: string,
  ): Promise<Result<string, AuthServiceError>> {
    const result = await facebookClient.get<FacebookTokenResponse>(
      "/v21.0/oauth/access_token",
      {
        params: {
          client_id: config.facebookAppId,
          client_secret: config.facebookAppSecret,
          redirect_uri: config.redirectUri,
          code,
        },
      },
    );

    if (!result.ok) {
      logger.error("Code → token exchange başarısız", "AuthService", result.error);
      return Result.fail({ message: "Token alınamadı", code: 401 });
    }

    return Result.ok(result.value.access_token);
  },

  async exchangeForLongLivedToken(
    config: OAuthConfig,
    shortLivedToken: string,
  ): Promise<Result<string, AuthServiceError>> {
    const result = await facebookClient.get<FacebookTokenResponse>(
      "/v21.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: config.facebookAppId,
          client_secret: config.facebookAppSecret,
          fb_exchange_token: shortLivedToken,
        },
      },
    );

    if (!result.ok) {
      logger.error("Long-lived token alınamadı", "AuthService", result.error);
      return Result.fail({ message: "Uzun süreli token alınamadı", code: 401 });
    }

    return Result.ok(result.value.access_token);
  },

  async fetchInstagramBusinessAccount(
    accessToken: string,
  ): Promise<Result<{ businessAccountId: string; instagramUserId: string }, AuthServiceError>> {
    const pagesResult = await facebookClient.get<FacebookPagesResponse>(
      "/v21.0/me/accounts",
      { params: { access_token: accessToken } },
    );

    if (!pagesResult.ok || pagesResult.value.data.length === 0) {
      return Result.fail({ message: "Bağlı Facebook sayfası bulunamadı", code: 404 });
    }

    const page = pagesResult.value.data[0];

    const igResult = await facebookClient.get<InstagramBusinessAccountResponse>(
      `/v21.0/${page.id}`,
      {
        params: {
          fields: "instagram_business_account",
          access_token: accessToken,
        },
      },
    );

    if (!igResult.ok || !igResult.value.instagram_business_account) {
      return Result.fail({
        message: "Instagram Business hesabı bulunamadı. Sayfanızın bir Instagram Business/Creator hesabına bağlı olduğundan emin olun.",
        code: 404,
      });
    }

    return Result.ok({
      businessAccountId: igResult.value.instagram_business_account.id,
      instagramUserId: igResult.value.instagram_business_account.id,
    });
  },

  async getAccountByUserId(
    userId: string,
  ): Promise<Result<ConnectedAccount, AuthServiceError>> {
    const account = await db.instagramAccount.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!account) {
      return Result.fail({
        message: "Bu kullanıcıya bağlı Instagram hesabı bulunamadı",
        code: 404,
      });
    }

    if (account.tokenExpiresAt < new Date()) {
      return Result.fail({
        message: "Instagram token süresi dolmuş. Lütfen hesabınızı yeniden bağlayın.",
        code: 401,
      });
    }

    return Result.ok({
      id: account.id,
      instagramUserId: account.instagramUserId,
      businessAccountId: account.businessAccountId,
      tokenExpiresAt: account.tokenExpiresAt,
    });
  },

  async getInstagramConfigByUserId(
    userId: string,
  ): Promise<Result<{ accessToken: string; businessAccountId: string }, AuthServiceError>> {
    const account = await db.instagramAccount.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!account) {
      return Result.fail({
        message: "Bu kullanıcıya bağlı Instagram hesabı bulunamadı",
        code: 404,
      });
    }

    if (account.tokenExpiresAt < new Date()) {
      return Result.fail({
        message: "Instagram token süresi dolmuş. Lütfen hesabınızı yeniden bağlayın.",
        code: 401,
      });
    }

    return Result.ok({
      accessToken: account.accessToken,
      businessAccountId: account.businessAccountId,
    });
  },
});

export type AuthService = ReturnType<typeof createAuthService>;
