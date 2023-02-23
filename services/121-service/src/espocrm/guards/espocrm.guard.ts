import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EspocrmService } from './../espocrm.service';

@Injectable()
export class EspocrmGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly espocemService: EspocrmService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const headerKey = 'x-signature';
    const request = context.switchToHttp().getRequest();
    const requestSignature = request.headers[headerKey];
    console.log('requestSignature: ', requestSignature);
    console.log('request.headers: ', request.headers);

    const espormControllerSettings = this.reflector.get<any>(
      'espocrm',
      context.getHandler(),
    );
    console.log('espormControllerSettings: ', espormControllerSettings);
    console.log('request.body: ', request.body);

    // Missing signature -> no access
    if (!requestSignature) {
      return false;
    }

    const secretForEndpoint = await this.espocemService.getSignature(
      espormControllerSettings[0],
      espormControllerSettings[1],
    );
    console.log('secretForEndpoint: ', secretForEndpoint);

    // Check if the signature is valid for the given programIds
    return this.checkSignatures(
      requestSignature,
      secretForEndpoint,
      request.body,
    );
  }

  private checkSignatures(
    signature: string,
    secret: string,
    body: any,
  ): boolean {
    // TODO: Implement this
    // console.log('signature: ', signature);
    // const hmacResult = crypto.createHmac('sha256', body, secret);
    // console.log('hmacResult: ', hmacResult);
    // return hmacResult === signature;
    return true;
  }
}
