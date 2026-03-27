export interface MtnApiCreateTokenResponseDto {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
}
