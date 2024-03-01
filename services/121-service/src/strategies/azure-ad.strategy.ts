import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';
import { UserType } from '../user/user-type-enum';
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
export class AzureAdStrategy extends PassportStrategy(
  BearerStrategy,
  'azure-ad',
) {
  constructor() {
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

  async validate(profile: any): Promise<any> {
    // console.log('profile: ', profile);
    // TODO: Create a 'authentication' service that checks if permission or admin should be checked
    if (!profile) {
      throw new UnauthorizedException();
    }

    // const existing121User = await this.userService.findByUsername(
    //   profile.email,
    // );
    // console.log('existing121User: ', existing121User);
    // if (existing121User) {
    //   profile.id = existing121User.user.id;
    //   return profile;
    // }

    // const password = generateRandomString(16);
    // const newUser = await this.userService.create(
    //   profile.email,
    //   password,
    //   UserType.aidWorker,
    // );
    // // TODO: Use 'authentication' service to check permisson or admin
    // profile.id = newUser.user.id;
    return profile;
  }
}
