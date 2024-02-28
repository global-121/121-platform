import { HttpException, HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CookieNames } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';
import { UserToken } from '../user/user.interface';
import { CookiesType } from './cookies.type';

export function verifyToken(token: string): UserToken {
  try {
    return jwt.verify(token, process.env.SECRETS_121_SERVICE_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return null;
    } else {
      throw err;
    }
  }
}

function getTokenIfValid(
  request: any,
  originInterface: InterfaceNames,
): string | null {
  if (request.cookies && interfacesMatch(request.cookies, originInterface)) {
    return getToken(request.cookies, originInterface);
  }
  return null;
}

export function getDecodedTokenOrThrow(request: any): UserToken {
  const notAuthorizedMessage = 'Not authorized';
  const headerKey = 'x-121-interface';

  if (!request.cookies || Object.keys(request.cookies).length === 0) {
    throw new HttpException(notAuthorizedMessage, HttpStatus.UNAUTHORIZED);
  }

  const originInterface: InterfaceNames = request.headers[headerKey];
  const token = getTokenIfValid(request, originInterface);

  if (!token) {
    throw new HttpException(notAuthorizedMessage, HttpStatus.UNAUTHORIZED);
  }
  const decoded = verifyToken(token);
  if (!decoded?.id) {
    throw new HttpException(notAuthorizedMessage, HttpStatus.UNAUTHORIZED);
  }
  return decoded;
}

export function getToken(
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

export function interfacesMatch(
  cookies: CookiesType,
  originInterface: InterfaceNames,
): boolean {
  return !!(
    (originInterface === InterfaceNames.portal &&
      cookies[CookieNames.portal]) ||
    (originInterface === InterfaceNames.awApp && cookies[CookieNames.awApp]) ||
    (originInterface === InterfaceNames.paApp && cookies[CookieNames.paApp]) ||
    (!originInterface && cookies[CookieNames.general])
  );
}
