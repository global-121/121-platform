import { CookieNames } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';

export function getUserIdFromRequest(attributeName: string, req: any): any {
  // A request is typed as any from the NestJS framework
  const headerKey = 'x-121-interface';
  const originInterface = req.headers[headerKey];
  let token;
  if (req.cookies) {
    if (
      originInterface === InterfaceNames.portal &&
      req.cookies[CookieNames.portal]
    ) {
      token = req.cookies[CookieNames.portal];
    } else if (
      originInterface === InterfaceNames.awApp &&
      req.cookies[CookieNames.awApp]
    ) {
      token = req.cookies[CookieNames.awApp];
    } else if (
      originInterface === InterfaceNames.paApp &&
      req.cookies[CookieNames.paApp]
    ) {
      token = req.cookies[CookieNames.paApp];
    } else if (!originInterface && req.cookies[CookieNames.general]) {
      token = req.cookies[CookieNames.general];
    } else {
      token = null;
    }
  }

  if (token) {
    return !!attributeName ? req.user?.[attributeName] : req.user;
  }
}
