import { createParamDecorator } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CookieNames } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';

export const User = createParamDecorator((data, req) => {
  // if route is protected, there is a user set in auth.middleware
  if (!!req.user) {
    return !!data ? req.user[data] : req.user;
  }

  // in case a route is not protected, we still want to get the optional auth user from jwt
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
    const decoded: any = jwt.verify(
      token,
      process.env.SECRETS_121_SERVICE_SECRET,
    );
    return !!data ? decoded[data] : decoded.user;
  }
});
