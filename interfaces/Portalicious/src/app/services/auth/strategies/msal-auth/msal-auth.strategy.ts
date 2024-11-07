import { Injectable } from '@angular/core';

import { BasicAuthStrategy } from '~/services/auth/strategies/basic-auth/basic-auth.strategy';

@Injectable({
  providedIn: 'root',
})
export class MsalAuthStrategy extends BasicAuthStrategy {
  // TODO: Remove "extends BasicAuthStrategy" and implement MSAL authentication
}
