import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { env } from '@121-service/src/env';
import { AuthenticatedUserParameters } from '@121-service/src/guards/authenticated-user.decorator';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import { InterfaceNames } from '@121-service/src/shared/enum/interface-names.enum';
import { UserRequestData } from '@121-service/src/user/user.interface';
import { UserService } from '@121-service/src/user/user.service';

@Injectable()
export class CookieJwtStrategy
  extends PassportStrategy(Strategy, 'cookie-jwt')
  implements OnModuleInit
{
  private userService: UserService;

  constructor(private moduleRef: ModuleRef) {
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

            default:
              token = req.cookies[CookieNames.general];
              break;
          }
          req.token = token;
          return token;
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: env.SECRETS_121_SERVICE_SECRET,
      passReqToCallback: true,
    });
  }

  async onModuleInit(): Promise<void> {
    const contextId = ContextIdFactory.create();
    this.userService = await this.moduleRef.resolve(UserService, contextId, {
      strict: false,
    });
  }

  async validate(request: any, payload: UserRequestData): Promise<any> {
    const authParams =
      request.authenticationParameters as AuthenticatedUserParameters;

    // This is an early return to allow the guard to be at the top of the controller and the decorator at the specific endpoints we want to protect.
    if (!authParams?.isGuarded) {
      return true;
    }

    if (authParams.permissions) {
      if (!request.params.projectId) {
        throw new HttpException(
          'Endpoint is missing projectId parameter',
          HttpStatus.BAD_REQUEST,
        );
      }
      const hasPermission = await this.userService.canActivate(
        authParams.permissions,
        request.params.projectId,
        payload.id,
      );
      if (!hasPermission) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    } else if (authParams.isAdmin) {
      const isAdmin = payload.admin === true;
      if (!isAdmin) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    } else if (authParams.isOrganizationAdmin) {
      const isOrganizationAdmin = payload.isOrganizationAdmin === true;
      if (!isOrganizationAdmin) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    }
    const username = (payload.username ?? '').toLowerCase();
    const user = await this.userService.findByUsernameOrThrow(username, {
      projectAssignments: true,
    });

    const userToken: UserRequestData = {
      id: payload.id,
      username,
      exp: payload.exp,
      admin: payload.admin,
      scope: request.params.projectId
        ? this.userService.getScopeForUser(user, request.params.projectId)
        : '',
      isOrganizationAdmin: payload.isOrganizationAdmin,
    };
    return userToken;
  }
}
