export interface SafaricomAuthResponseParams {
  readonly data: SafaricomAuthDataResponse;
}

interface SafaricomAuthDataResponse {
  readonly access_token: string;
  readonly expires_in: number;
}
