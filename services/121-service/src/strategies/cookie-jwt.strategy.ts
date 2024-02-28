import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { CookieNames } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';
import { UserToken } from '../user/user.interface';

@Injectable()
export class CookieJwtStrategy extends PassportStrategy(Strategy, 'cookie-jwt') {
  constructor() {
    super({
      jwtFromRequest: (req: any) => {
        let token = null;
        const headerKey = 'x-121-interface';
        const originInterface: InterfaceNames = req.headers[headerKey];

        if (req && req.cookies) {
          switch (originInterface) {
            case InterfaceNames.portal:
              token = req.cookies[CookieNames.portal];
              break;
            case InterfaceNames.awApp:
              token = req.cookies[CookieNames.awApp];
              break;
            case InterfaceNames.paApp:
              token = req.cookies[CookieNames.paApp];
              break;

            default:
              token = req.cookies[CookieNames.general];
              break;
          }
          return token;
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.SECRETS_121_SERVICE_SECRET,
    });
  }

  async validate(payload: any): Promise<any> {
    const userToken: UserToken = {
      id: payload.id,
      username: payload.username,
      exp: payload.exp,
      admin: payload.admin,
    };
    return userToken;
  }
}
