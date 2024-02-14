import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';

const config = {
  credentials: {
    tenantID: 'dfffb37a-55a4-4919-9c93-7028d115eac2',
    clientID: '81329ff8-25f7-47b4-b4ae-ae12d17a47a4',
    audience: '81329ff8-25f7-47b4-b4ae-ae12d17a47a4',
  },
  metadata: {
    authority: 'login.microsoftonline.com',
    discovery: '.well-known/openid-configuration',
    version: 'v2.0',
  },
  settings: {
    // TODO: Probably should be set to true in production
    validateIssuer: false,
    passReqToCallback: false,
    loggingLevel: 'info',
  },
};
const EXPOSED_SCOPES = ['User.Read']; //provide a scope of your azure AD

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
    console.log('profile: ', profile);
    if (!profile) {
      throw new UnauthorizedException();
    }
    // TODO: Find user by email (in 121 DB) and return the ID 
    // TODO: If the Azure profile is valid & the user does not exist in 121, create a new user
    profile.id = 1;
    return profile;
  }
}
