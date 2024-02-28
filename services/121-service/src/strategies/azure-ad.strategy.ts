import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';

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
    passReqToCallback: false,
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
    console.log('profile: ', profile);
    if (!profile) {
      throw new UnauthorizedException();
    }
    profile.id = 1;
    return profile;
  }
}
