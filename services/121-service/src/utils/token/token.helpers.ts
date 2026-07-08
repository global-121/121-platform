import { TokenSet } from '@121-service/src/utils/token/token-set';

// Using a type here instead of interface, because we need the union type to enforce that at least one of expiresAt or expiresIn is provided
type CreateTokenSetInput =
  | {
      accessToken: string;
      expiresAt: number;
      expiresIn?: number;
    }
  | {
      accessToken: string;
      expiresAt?: number;
      expiresIn: number;
    };

export function createTokenSet({
  accessToken,
  expiresAt,
  expiresIn,
}: CreateTokenSetInput): TokenSet {
  let computedExpiresAt = expiresAt;
  if (computedExpiresAt === undefined && expiresIn !== undefined) {
    computedExpiresAt = Date.now() + expiresIn * 1000;
  }

  // `CreateTokenSetInput` enforces `expiresAt` or `expiresIn`, so this should never happen.
  // But we need it to make Ts happy
  if (computedExpiresAt === undefined) {
    throw new Error('Token expiry must be provided');
  }

  return { accessToken, expiresAt: computedExpiresAt };
}

/**
 * This function checks if a token is still valid by checking if expiresAt is at least 5 minutes in the future
 */
export function isTokenValid(
  tokenSet: TokenSet | undefined,
): tokenSet is TokenSet {
  if (!tokenSet) {
    return false;
  }

  const timeLeftBeforeExpire = tokenSet.expiresAt - Date.now();
  // We set a buffer of 5 minutes to make sure that when doing the subsequent POST call, the token is still valid.
  return timeLeftBeforeExpire > 5 * 60 * 1000;
}
