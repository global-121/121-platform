export interface AuthResponseSafaricomApiDto {
  readonly data: {
    readonly access_token: string;
    readonly expires_in: number;
  };
}
