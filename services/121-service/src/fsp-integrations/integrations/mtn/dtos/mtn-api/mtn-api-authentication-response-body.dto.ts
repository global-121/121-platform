export class MtnApiAuthenticationResponseBodyDto {
  public readonly access_token: string;
  public readonly token_type: 'access_token';
  public readonly expires_in: number;
}
