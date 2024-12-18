import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

@Injectable()
export class TokenValidationService {
  public isTokenValid(
    tokenSet: TokenSet,
    expiresAtInSeconds = false, // If true, then expires_at is assumed in milliseconds, as it should be
  ): tokenSet is TokenSet & Required<Pick<TokenSet, 'access_token'>> {
    if (!tokenSet || !tokenSet.expires_at) {
      return false;
    }

    // convert to milliseconds if needed
    if (expiresAtInSeconds) {
      tokenSet.expires_at *= 1000;
    }

    const timeLeftBeforeExpire = tokenSet.expires_at - Date.now();
    // We set a buffer of 5 minutes to make sure that when doing the subsequent POST call, the token is still valid.
    return timeLeftBeforeExpire > 5 * 60 * 1000;
  }
}
