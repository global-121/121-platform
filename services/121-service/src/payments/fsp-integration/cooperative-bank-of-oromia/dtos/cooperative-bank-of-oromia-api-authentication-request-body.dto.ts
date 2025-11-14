export interface CooperativeBankOfOromiaApiAuthenticationRequestBodyDto {
  readonly grant_type: 'client_credentials';
  readonly client_id: string | undefined;
  readonly client_secret: string | undefined;
}
