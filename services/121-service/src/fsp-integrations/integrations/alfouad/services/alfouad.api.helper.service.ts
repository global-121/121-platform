import { Injectable } from '@nestjs/common';
import { js2xml } from 'xml-js';

import { env } from '@121-service/src/env';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

@Injectable()
export class AlfouadApiHelperService {
  public getBaseUrl(): URL {
    if (env.ALFOUAD_MODE === FspMode.mock) {
      return new URL('api/fsp/alfouad/', env.MOCK_SERVICE_URL);
    }
  
    return new URL(`${env.ALFOUAD_API_URL!}/`);
  }

  public buildAuthorizationToken({
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
    const xml = js2xml(
      {
        Authentication: {
          Account: { _text: account },
          BranchId: { _text: branchId },
          UserName: { _text: username },
          Password: { _text: encryptedPassword },
        },
      },
      { compact: true },
    );

    return Buffer.from(xml, 'utf8').toString('base64');
  }

  public createRequestHeaders({
    authorizationToken,
  }: {
    authorizationToken: string;
  }): Headers {
    return new Headers({
      Authorization: `Bearer ${authorizationToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  }
}
