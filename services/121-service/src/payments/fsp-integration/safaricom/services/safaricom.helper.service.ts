import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

@Injectable()
export class SafaricomHelperService {
  // ##TODO: can this be a combined helper method with intersolve-visa isTokenValid
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
