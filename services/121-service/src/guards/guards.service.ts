import { CanActivate } from '@nestjs/common';
import { CookiesType } from './cookies.type';
import { Injectable } from '@nestjs/common';
import { CookieNames } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';

@Injectable()
export class GuardsService {
  public getToken(
    cookies: CookiesType,
    originInterface: InterfaceNames,
  ): string {
    {
      let token: string;
      switch (originInterface) {
        case InterfaceNames.portal:
          token = cookies[CookieNames.portal];
          break;
        case InterfaceNames.awApp:
          token = cookies[CookieNames.awApp];
          break;
        case InterfaceNames.paApp:
          token = cookies[CookieNames.paApp];
          break;

        default:
          token = cookies[CookieNames.general];
          break;
      }
      return token;
    }
  }

  public interfacesMatch(
    cookies: CookiesType,
    originInterface: InterfaceNames,
  ): boolean {
    return !!(
      (originInterface === InterfaceNames.portal &&
        cookies[CookieNames.portal]) ||
      (originInterface === InterfaceNames.awApp &&
        cookies[CookieNames.awApp]) ||
      (originInterface === InterfaceNames.paApp &&
        cookies[CookieNames.paApp]) ||
      (!originInterface && cookies[CookieNames.general])
    );
  }
}
