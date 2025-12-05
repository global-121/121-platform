export interface CooperativeBankOfOromiaApiAuthenticationResponseBodyDto {
  // When using valid credentials
  readonly access_token?: string;
  readonly expires_in?: number;

  // When using invalid credentials
  readonly error?: string;
  readonly error_description?: string;
}
