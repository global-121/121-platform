import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { EXTERNAL_API } from '../../config';
import { CookieNames } from '../../shared/enum/cookie.enums';
import {
  CustomHttpService,
  Header,
} from '../../shared/services/custom-http.service';

@Injectable()
export class AxiosCallsService {
  private httpService = new CustomHttpService(new HttpService());

  public getBaseUrl(): string {
    if (process.env.NODE_ENV === 'development') {
      // If development, use localhost as base url
      return `http://localhost:${process.env.PORT_121_SERVICE}/api`;
    } else {
      return EXTERNAL_API.rootApi;
    }
  }

  public async loginAsAdmin(): Promise<any> {
    const url = `${this.getBaseUrl()}/users/login`;
    return this.httpService.post(url, {
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
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
    const accessToken = cookies
      .find((cookie: string) => cookie.startsWith(CookieNames.general))
      .split(';')[0];

    return accessToken;
  }
}
