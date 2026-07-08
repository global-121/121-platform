export interface TokenSet {
  accessToken: string;
  // Absolute expiry time in milliseconds since the Unix epoch.
  expiresAt: number;
}
