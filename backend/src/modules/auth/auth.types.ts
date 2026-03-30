export interface OAuthConfig {
  readonly facebookAppId: string;
  readonly facebookAppSecret: string;
  readonly redirectUri: string;
}

export interface FacebookTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in?: number;
}

export interface FacebookPage {
  readonly id: string;
  readonly name: string;
  readonly access_token: string;
}

export interface FacebookPagesResponse {
  readonly data: FacebookPage[];
}

export interface InstagramBusinessAccountResponse {
  readonly instagram_business_account?: {
    readonly id: string;
  };
}

export interface ConnectedAccount {
  readonly id: string;
  readonly instagramUserId: string;
  readonly businessAccountId: string;
  readonly tokenExpiresAt: Date;
}

export interface OAuthCallbackParams {
  readonly code: string;
  readonly userId: string;
}
