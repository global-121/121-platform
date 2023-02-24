import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import crypto from 'crypto';
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
    const espormControllerSettings = this.reflector.get<any>(
      'espocrm',
      context.getHandler(),
    );

    // Missing signature -> no access
    if (!requestSignature) {
      return false;
    }

    const webhook = await this.espocemService.getWebhook(
      espormControllerSettings[0],
      espormControllerSettings[1],
    );

    // Check if the signature is valid for the given programIds
    return this.checkSignatures(
      requestSignature,
      webhook.secretKey,
      request.body,
      webhook.referenceId,
    );
  }

  private checkSignatures(
    signature: string,
    secret: string,
    body: any,
    webhookId: string,
  ): boolean {
    const stringifiedBody = JSON.stringify(body);
    const hmac = crypto.createHmac('sha256', secret).update(stringifiedBody);
    const hmacString = hmac.digest().toString('binary');
    const concatString = webhookId + ':' + hmacString;
    const base64encodedString = this.encodeBase64(concatString);

    return signature === base64encodedString;
  }

  private encodeBase64(data): string {
    return Buffer.from(data, 'binary').toString('base64');
  }
}
