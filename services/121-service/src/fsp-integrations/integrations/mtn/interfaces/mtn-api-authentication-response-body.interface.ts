export interface MtnApiAuthenticationResponseBody {
  readonly access_token: string;
  readonly token_type: 'access_token';
  readonly expires_in: number;
}
