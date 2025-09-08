import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';

import { EXTERNAL_API, IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class AxiosCallsService {
  private httpService = new CustomHttpService(new HttpService());

  public getBaseUrl(): string {
    if (IS_DEVELOPMENT) {
      return `http://localhost:${env.PORT_121_SERVICE}/api`;
    }
    return EXTERNAL_API.rootApi;
  }

  public async loginAsAdmin(): Promise<AxiosResponse> {
    const url = `${this.getBaseUrl()}/users/login`;
    return this.httpService.post(url, {
      username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    });
  }

  public accesTokenToHeaders(accessToken: string): Header[] {
    return [
      {
        name: 'Cookie',
        value: accessToken,
      },
    ];
  }

  public async getAccessToken(): Promise<string> {
    const login = await this.loginAsAdmin();
    const cookies = login.headers['set-cookie'];
    try {
      const accessToken = cookies
        .find((cookie: string) => cookie.startsWith(CookieNames.general))
        .split(';')[0];
      return accessToken;
    } catch (error) {
      throw new Error(
        `Error while extracting access token from cookies: ${error}`,
      );
    }
  }
}
