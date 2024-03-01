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
import { UserType } from '../user/user-type-enum';
import { UserRO } from '../user/user.interface';
import { UserService } from '../user/user.service';
import { generateRandomString } from '../utils/getRandomValue.helper';

const config = {
  credentials: {
    tenantID: process.env.AZURE_ENTRA_TENANT_ID,
    clientID: process.env.AZURE_ENTRA_CLIENT_ID,
    audience: `api://${process.env.AZURE_ENTRA_CLIENT_ID}`,
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
    loggingLevel: 'info',
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
      identityMetadata: `https://${config.metadata.authority}/${config.credentials.tenantID}/${config.metadata.version}/${config.metadata.discovery}`,
      issuer: `https://${config.metadata.authority}/${config.credentials.tenantID}/${config.metadata.version}`,
      clientID: config.credentials.clientID,
      audience: config.credentials.audience,
      validateIssuer: config.settings.validateIssuer,
      passReqToCallback: config.settings.passReqToCallback,
      loggingLevel: config.settings.loggingLevel,
      scope: EXPOSED_SCOPES,
      loggingNoPII: false,
    });
  }

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    this.userService = await this.moduleRef.resolve(UserService, contextId, {
      strict: false,
    });
  }

  async validate(response: any): Promise<any> {
    if (!response) {
      throw new UnauthorizedException();
    }

    let user: UserRO;
    const username = response.email;

    try {
      user = await this.userService.findByUsername(username);
    } catch (error: Error | unknown) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.NOT_FOUND
      ) {
        const password = generateRandomString(16);
        user = await this.userService.create(
          username,
          password,
          UserType.aidWorker,
        );
      } else {
        throw error;
      }
    }

    return {
      ...response,
      id: user?.user?.id,
    };
  }
}
