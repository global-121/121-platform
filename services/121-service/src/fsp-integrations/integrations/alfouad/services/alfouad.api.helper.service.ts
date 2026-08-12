import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

@Injectable()
export class AlfouadApiHelperService {
  public getBaseUrl(): URL {
    if (env.ALFOUAD_MODE === FspMode.mock) {
      return new URL('api/fsp/alfouad/', env.MOCK_SERVICE_URL);
    }

    if (!env.ALFOUAD_API_URL) {
      throw new Error(
        'ALFOUAD_API_URL is not set (required when ALFOUAD_MODE is EXTERNAL)',
      );
    }
  
    return new URL(`${env.ALFOUAD_API_URL!}/`);
  }

  public buildAuthorizationValue({
    account,
    branchId,
    username,
    encryptedPassword,
  }: {
    account: string;
    branchId: string;
    username: string;
    encryptedPassword: string;
  }): string {
    const xml =
      `<Authentication>` +
      `<Account>${this.escapeXml(account)}</Account>` +
      `<BranchId>${this.escapeXml(branchId)}</BranchId>` +
      `<UserName>${this.escapeXml(username)}</UserName>` +
      `<Password>${this.escapeXml(encryptedPassword)}</Password>` +
      `</Authentication>`;
    return Buffer.from(xml, 'utf8').toString('base64');
  }

  public createRequestHeaders({
    authorizationValue,
  }: {
    authorizationValue: string;
  }): Headers {
    return new Headers({
      Authorization: `Bearer ${authorizationValue}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
