export interface AirtelApiAuthenticationRequestBodyDto {
  readonly grant_type: 'client_credentials';
  readonly client_id: string | undefined;
  readonly client_secret: string | undefined;
}
