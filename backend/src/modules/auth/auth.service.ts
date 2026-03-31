import { Result } from "../../shared/result";
import { HttpClient } from "../../shared/httpClient";
import { logger } from "../../shared/logger";
import { PrismaClient } from "@prisma/client";
import {
  OAuthConfig,
  FacebookTokenResponse,
  FacebookPagesResponse,
  InstagramBusinessAccountResponse,
  InstagramUserProfileResponse,
  FacebookPageDetailResponse,
  ConnectedAccount,
  OAuthCallbackParams,
} from "./auth.types";

const OAUTH_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_read_engagement",
  "pages_show_list",
].join(",");

/** Sadece Facebook Sayfa bağlantısı — Login’de geçerli izinler (pages_manage_metadata geçersiz sayılıyor) */
const FACEBOOK_PAGE_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
].join(",");

const LONG_LIVED_TOKEN_DAYS = 60;

/** GET /api/accounts sırasında profil yenileme aralığı (ms) — Meta limiti için */
const PROFILE_SYNC_MIN_INTERVAL_MS =
  (Number(process.env.INSTAGRAM_PROFILE_SYNC_MINUTES) || 5) * 60 * 1000;

interface AuthServiceError {
  readonly message: string;
  readonly code: number;
}

export const createAuthService = (
  facebookClient: HttpClient,
  db: PrismaClient,
) => ({
  buildAuthorizationUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.facebookAppId,
      redirect_uri: config.redirectUri,
      scope: OAUTH_SCOPES,
      response_type: "code",
      state,
    });
    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  },

  buildFacebookPageAuthorizationUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.facebookAppId,
      redirect_uri: config.redirectUri,
      scope: FACEBOOK_PAGE_OAUTH_SCOPES,
      response_type: "code",
      state,
    });
    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  },

  async handleCallback(
    config: OAuthConfig,
    params: OAuthCallbackParams,
  ): Promise<Result<ConnectedAccount, AuthServiceError>> {
    logger.info("OAuth callback işleniyor", "AuthService");

    const shortTokenResult = await this.exchangeCodeForToken(
      config,
      params.code,
      undefined,
    );
    if (!shortTokenResult.ok) return shortTokenResult;

    const longTokenResult = await this.exchangeForLongLivedToken(
      config,
      shortTokenResult.value,
    );
    if (!longTokenResult.ok) return longTokenResult;

    const longLivedToken = longTokenResult.value;

    const accountResult =
      await this.fetchInstagramBusinessAccount(longLivedToken);
    if (!accountResult.ok) return accountResult;

    const { businessAccountId, instagramUserId, pageAccessToken } =
      accountResult.value;

    const profile = await this.fetchInstagramUserProfile(
      instagramUserId,
      pageAccessToken,
    );

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
        ...(profile
          ? {
              username: profile.username ?? null,
              name: profile.name ?? null,
              profilePictureUrl: profile.profile_picture_url ?? null,
              followersCount: profile.followers_count ?? 0,
              lastProfileSyncedAt: new Date(),
            }
          : {}),
      },
      create: {
        userId: params.userId,
        instagramUserId,
        businessAccountId,
        accessToken: longLivedToken,
        tokenExpiresAt,
        username: profile?.username ?? null,
        name: profile?.name ?? null,
        profilePictureUrl: profile?.profile_picture_url ?? null,
        followersCount: profile?.followers_count ?? 0,
        lastProfileSyncedAt: profile ? new Date() : null,
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
    redirectUriOverride?: string,
  ): Promise<Result<string, AuthServiceError>> {
    const redirectUri = redirectUriOverride ?? config.redirectUri;
    const result = await facebookClient.get<FacebookTokenResponse>(
      "/v21.0/oauth/access_token",
      {
        params: {
          client_id: config.facebookAppId,
          client_secret: config.facebookAppSecret,
          redirect_uri: redirectUri,
          code,
        },
      },
    );

    if (!result.ok) {
      logger.error(
        "Code → token exchange başarısız",
        "AuthService",
        result.error,
      );
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
  ): Promise<
    Result<
      {
        businessAccountId: string;
        instagramUserId: string;
        pageAccessToken: string;
      },
      AuthServiceError
    >
  > {
    const pagesResult = await facebookClient.get<FacebookPagesResponse>(
      "/v21.0/me/accounts",
      { params: { access_token: accessToken } },
    );

    if (!pagesResult.ok || pagesResult.value.data.length === 0) {
      return Result.fail({
        message: "Bağlı Facebook sayfası bulunamadı",
        code: 404,
      });
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
        message:
          "Instagram Business hesabı bulunamadı. Sayfanızın bir Instagram Business/Creator hesabına bağlı olduğundan emin olun.",
        code: 404,
      });
    }

    return Result.ok({
      businessAccountId: igResult.value.instagram_business_account.id,
      instagramUserId: igResult.value.instagram_business_account.id,
      pageAccessToken: page.access_token,
    });
  },

  /**
   * Instagram Graph API — sayfa erişim jetonu ile IG kullanıcı profili.
   * followers_count bazı uygulamalarda yetki gerektirebilir; önce tam alan denenir.
   */
  async fetchInstagramUserProfile(
    igUserId: string,
    pageAccessToken: string,
  ): Promise<InstagramUserProfileResponse | null> {
    const fieldSets = [
      "username,name,profile_picture_url,followers_count",
      "username,name,profile_picture_url",
    ];

    for (const fields of fieldSets) {
      const result = await facebookClient.get<InstagramUserProfileResponse>(
        `/v21.0/${igUserId}`,
        {
          params: {
            fields,
            access_token: pageAccessToken,
          },
        },
      );

      if (result.ok) {
        logger.info(
          `Instagram profil alındı: @${result.value.username ?? "?"}`,
          "AuthService",
        );
        return result.value;
      }

      logger.warn(
        `Instagram profil alanı başarısız (${fields}), yeniden deneniyor`,
        "AuthService",
        result.error,
      );
    }

    logger.error(
      "Instagram profil bilgisi çekilemedi (tüm alan setleri başarısız)",
      "AuthService",
    );
    return null;
  },

  /**
   * Kayıtlı kullanıcı token'ı ile IG'ye bağlı Facebook sayfasını bulur (çoklu sayfa desteği).
   */
  async findPageAccessTokenForIgUser(
    userAccessToken: string,
    targetIgUserId: string,
  ): Promise<Result<string, AuthServiceError>> {
    const pagesResult = await facebookClient.get<FacebookPagesResponse>(
      "/v21.0/me/accounts",
      { params: { access_token: userAccessToken } },
    );

    if (!pagesResult.ok || pagesResult.value.data.length === 0) {
      return Result.fail({
        message: "Facebook sayfaları alınamadı",
        code: 404,
      });
    }

    for (const page of pagesResult.value.data) {
      const igResult = await facebookClient.get<InstagramBusinessAccountResponse>(
        `/v21.0/${page.id}`,
        {
          params: {
            fields: "instagram_business_account",
            access_token: userAccessToken,
          },
        },
      );

      if (!igResult.ok) {
        continue;
      }

      const igId = igResult.value.instagram_business_account?.id;
      if (igId === targetIgUserId) {
        return Result.ok(page.access_token);
      }
    }

    return Result.fail({
      message: "Bu Instagram hesabına bağlı Facebook sayfası bulunamadı",
      code: 404,
    });
  },

  /**
   * Veritabanındaki Instagram satırı için Graph’ten güncel profil (takipçi dahil).
   * @param forceSync — throttle’ı yok say (ör. ?refresh=1)
   */
  async refreshInstagramAccountFromGraph(
    account: {
      id: string;
      instagramUserId: string;
      accessToken: string;
      tokenExpiresAt: Date;
      lastProfileSyncedAt: Date | null;
    },
    options?: { forceSync?: boolean },
  ): Promise<boolean> {
    if (account.tokenExpiresAt < new Date()) {
      logger.warn(
        "Instagram token süresi dolmuş, profil yenilenmedi",
        "AuthService",
      );
      return false;
    }

    if (!options?.forceSync && account.lastProfileSyncedAt) {
      const elapsed =
        Date.now() - account.lastProfileSyncedAt.getTime();
      if (elapsed < PROFILE_SYNC_MIN_INTERVAL_MS) {
        return false;
      }
    }

    const pageTokenResult = await this.findPageAccessTokenForIgUser(
      account.accessToken,
      account.instagramUserId,
    );

    if (!pageTokenResult.ok) {
      logger.warn(
        "Profil yenileme: sayfa token bulunamadı",
        "AuthService",
        pageTokenResult.error,
      );
      return false;
    }

    const profile = await this.fetchInstagramUserProfile(
      account.instagramUserId,
      pageTokenResult.value,
    );

    if (!profile) {
      return false;
    }

    await db.instagramAccount.update({
      where: { id: account.id },
      data: {
        username: profile.username ?? null,
        name: profile.name ?? null,
        profilePictureUrl: profile.profile_picture_url ?? null,
        followersCount: profile.followers_count ?? 0,
        lastProfileSyncedAt: new Date(),
      },
    });

    return true;
  },

  async handleFacebookPagesOAuth(
    config: OAuthConfig,
    params: { code: string; userId: string; redirectUri: string },
  ): Promise<Result<{ count: number }, AuthServiceError>> {
    logger.info("Facebook Sayfa OAuth callback işleniyor", "AuthService");

    const shortTokenResult = await this.exchangeCodeForToken(
      config,
      params.code,
      params.redirectUri,
    );
    if (!shortTokenResult.ok) return shortTokenResult;

    const longTokenResult = await this.exchangeForLongLivedToken(
      config,
      shortTokenResult.value,
    );
    if (!longTokenResult.ok) return longTokenResult;

    const userToken = longTokenResult.value;

    const pagesResult = await facebookClient.get<FacebookPagesResponse>(
      "/v21.0/me/accounts",
      {
        params: {
          fields: "id,name,access_token",
          access_token: userToken,
        },
      },
    );

    if (!pagesResult.ok || pagesResult.value.data.length === 0) {
      return Result.fail({
        message:
          "Yönettiğiniz Facebook sayfası bulunamadı. Bir sayfa yöneticisi olduğunuzdan emin olun.",
        code: 404,
      });
    }

    let count = 0;
    for (const page of pagesResult.value.data) {
      const detailResult = await facebookClient.get<FacebookPageDetailResponse>(
        `/v21.0/${page.id}`,
        {
          params: {
            fields: "name,fan_count,link,picture{url}",
            access_token: page.access_token,
          },
        },
      );

      const detail = detailResult.ok ? detailResult.value : null;

      await db.facebookPageAccount.upsert({
        where: {
          userId_pageId: {
            userId: params.userId,
            pageId: page.id,
          },
        },
        update: {
          pageName: detail?.name ?? page.name,
          pageAccessToken: page.access_token,
          fanCount: detail?.fan_count ?? 0,
          pictureUrl: detail?.picture?.data?.url ?? null,
          pageLink: detail?.link ?? null,
          lastProfileSyncedAt: new Date(),
        },
        create: {
          userId: params.userId,
          pageId: page.id,
          pageName: detail?.name ?? page.name,
          pageAccessToken: page.access_token,
          fanCount: detail?.fan_count ?? 0,
          pictureUrl: detail?.picture?.data?.url ?? null,
          pageLink: detail?.link ?? null,
          lastProfileSyncedAt: new Date(),
        },
      });
      count += 1;
    }

    logger.info(`${count} Facebook sayfası kaydedildi`, "AuthService");
    return Result.ok({ count });
  },

  async refreshFacebookPageAccountFromGraph(
    account: {
      id: string;
      pageId: string;
      pageAccessToken: string;
      lastProfileSyncedAt: Date | null;
    },
    options?: { forceSync?: boolean },
  ): Promise<boolean> {
    if (!options?.forceSync && account.lastProfileSyncedAt) {
      const elapsed = Date.now() - account.lastProfileSyncedAt.getTime();
      if (elapsed < PROFILE_SYNC_MIN_INTERVAL_MS) {
        return false;
      }
    }

    const detailResult = await facebookClient.get<FacebookPageDetailResponse>(
      `/v21.0/${account.pageId}`,
      {
        params: {
          fields: "name,fan_count,link,picture{url}",
          access_token: account.pageAccessToken,
        },
      },
    );

    if (!detailResult.ok) {
      return false;
    }

    const d = detailResult.value;
    await db.facebookPageAccount.update({
      where: { id: account.id },
      data: {
        pageName: d.name ?? undefined,
        fanCount: d.fan_count ?? 0,
        pictureUrl: d.picture?.data?.url ?? null,
        pageLink: d.link ?? null,
        lastProfileSyncedAt: new Date(),
      },
    });

    return true;
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
        message:
          "Instagram token süresi dolmuş. Lütfen hesabınızı yeniden bağlayın.",
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
  ): Promise<
    Result<{ accessToken: string; businessAccountId: string }, AuthServiceError>
  > {
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
        message:
          "Instagram token süresi dolmuş. Lütfen hesabınızı yeniden bağlayın.",
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
