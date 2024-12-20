import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

@Injectable()
export class TokenValidationService {
  /**
   * This function checks if a token is still valid by checking if expires_at is at least 5 minutes in the future
   *
   * @param {TokenSet} tokenSet - The tokenSet which contains the expires_at property.
   * @returns {boolean} True or false depending on token valid or not.
   */
  public isTokenValid(
    tokenSet: TokenSet,
  ): tokenSet is TokenSet & Required<Pick<TokenSet, 'access_token'>> {
    if (!tokenSet || !tokenSet.expires_at) {
      return false;
    }

    const timeLeftBeforeExpire = tokenSet.expires_at - Date.now();
    // We set a buffer of 5 minutes to make sure that when doing the subsequent POST call, the token is still valid.
    return timeLeftBeforeExpire > 5 * 60 * 1000;
  }
}
