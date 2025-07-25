import {
  HttpStatus,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';

import { env } from '@121-service/src/env';
import { AuthenticatedUserParameters } from '@121-service/src/guards/authenticated-user.decorator';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserRequestData } from '@121-service/src/user/user.interface';
import { UserService } from '@121-service/src/user/user.service';

const config = {
  credentials: {
    clientID: env.AZURE_ENTRA_CLIENT_ID,
    audience: `api://${env.AZURE_ENTRA_CLIENT_ID}`,
  },
  metadata: {
    authority: 'login.microsoftonline.com',
    discovery: '.well-known/openid-configuration',
    version: 'v2.0',
  },
  settings: {
    // TODO: Probably should be set to true in production
    validateIssuer: false,
    passReqToCallback: true,
    loggingLevel: 'error',
  },
};
const EXPOSED_SCOPES = ['User.read']; //provide a scope of your azure AD

@Injectable()
export class AzureAdStrategy
  extends PassportStrategy(BearerStrategy, 'azure-ad')
  implements OnModuleInit
{
  private userService: UserService;
  constructor(private moduleRef: ModuleRef) {
    super({
      identityMetadata: `https://${config.metadata.authority}/common/${config.metadata.version}/${config.metadata.discovery}`,
      clientID: config.credentials.clientID || '-', //TODO: this works to avoid 121-service filure on no-sso scenario, but should be done better
      validateIssuer: config.settings.validateIssuer,
      passReqToCallback: config.settings.passReqToCallback,
      loggingLevel: config.settings.loggingLevel,
      scope: EXPOSED_SCOPES,
      loggingNoPII: false,
    });
  }

  async onModuleInit(): Promise<void> {
    const contextId = ContextIdFactory.create();
    this.userService = await this.moduleRef.resolve(UserService, contextId, {
      strict: false,
    });
  }

  async validate(request: any, payload: any): Promise<any> {
    if (
      !payload ||
      !(!!payload.unique_name || !!payload.preferred_username) ||
      !payload.exp
    ) {
      throw new UnauthorizedException();
    }

    let user: UserEntity;
    const usernamePayload: string =
      payload.unique_name?.toLowerCase() ||
      payload.preferred_username?.toLowerCase();
    const splitUsernamePayload = usernamePayload.split('mail#');
    const username =
      splitUsernamePayload.length > 1
        ? splitUsernamePayload[1]
        : usernamePayload;

    const authParams =
      request.authenticationParameters as AuthenticatedUserParameters;

    // This is an early return to allow the guard to be at the top of the controller and the decorator at the specific endpoints we want to protect.
    if (!authParams?.isGuarded) {
      return true;
    }

    try {
      // Try to find user by username (this is an email address in our case)
      user = await this.userService.findByUsernameOrThrow(username, {
        programAssignments: true,
      });

      if (!user.isEntraUser) {
        user = await this.userService.updateUser({
          id: user.id,
          isEntraUser: true,
        });
      }
      // Update last login only once per day (instead of on every request)
      const today = new Date();
      const lastLogin = user.lastLogin;
      if (
        !lastLogin ||
        today.getDate() !== lastLogin.getDate() ||
        today.getMonth() !== lastLogin.getMonth() ||
        today.getFullYear() !== lastLogin.getFullYear()
      ) {
        await this.userService.updateUser({
          id: user.id,
          lastLogin: new Date(),
        });
      }
    } catch (error: Error | unknown) {
      throw new HttpException(
        { message: 'Unknown user account or authentication failed.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (authParams.permissions) {
      if (!request.params.programId) {
        throw new HttpException(
          'Endpoint is missing programId parameter',
          HttpStatus.BAD_REQUEST,
        );
      }
      const hasPermission = await this.userService.canActivate(
        authParams.permissions,
        request.params.programId,
        user.id,
      );
      if (!hasPermission) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    } else if (authParams.isAdmin) {
      if (!user.admin) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    } else if (authParams.isOrganizationAdmin) {
      if (!user.isOrganizationAdmin) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
    }

    const userToken: UserRequestData = {
      id: user.id,
      username: user.username,
      exp: payload.exp,
      admin: user.admin,
      scope: request.params.programId
        ? this.userService.getScopeForUser(user, request.params.programId)
        : '',
      isOrganizationAdmin: payload.isOrganizationAdmin,
    };
    return userToken;
  }
}
