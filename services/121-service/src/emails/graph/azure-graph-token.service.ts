import {
  type AccessToken,
  ManagedIdentityCredential,
  type TokenCredential,
} from '@azure/identity';
import { Injectable } from '@nestjs/common';

import { EmailDeliveryError } from '@121-service/src/emails/errors/email-delivery.error';
import { env } from '@121-service/src/env';

const GRAPH_API_DEFAULT_SCOPE = 'https://graph.microsoft.com/.default';
const TOKEN_ACQUISITION_FAILED_MESSAGE =
  'Failed to acquire Microsoft Graph access token from the Azure User Assigned Managed Identity.';

/**
 * Acquires Microsoft Graph access tokens using the Azure User Assigned
 * Managed Identity attached to the running instance.
 *
 * Wrapped in its own service so it can be mocked in unit tests and so
 * the credential is constructed lazily (and only once).
 */
@Injectable()
export class AzureGraphTokenService {
  private credential: TokenCredential | undefined;

  public async getAccessToken(): Promise<string> {
    let accessToken: AccessToken | null;
    try {
      const credential = this.getOrCreateCredential();
      accessToken = await credential.getToken(GRAPH_API_DEFAULT_SCOPE);
    } catch (error) {
      throw new EmailDeliveryError(TOKEN_ACQUISITION_FAILED_MESSAGE, {
        cause: error,
      });
    }

    if (!accessToken?.token) {
      throw new EmailDeliveryError(TOKEN_ACQUISITION_FAILED_MESSAGE);
    }

    return accessToken.token;
  }

  private getOrCreateCredential(): TokenCredential {
    if (!this.credential) {
      this.credential = new ManagedIdentityCredential({
        clientId: env.AZURE_USER_ASSIGNED_IDENTITY_CLIENT_ID,
      });
    }
    return this.credential;
  }
}
