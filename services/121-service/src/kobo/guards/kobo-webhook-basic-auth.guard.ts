import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Equal, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';

const unauthorizedMessage = 'Unauthorized';

/**
 * Validates the Basic auth credentials on the Kobo webhook endpoint.
 *
 * When a KoboEntity has `webhookAuthUsername` / `webhookAuthPassword` stored
 * (set at integration time), every incoming request for that asset must carry
 * a matching `Authorization: Basic …` header. Kobo sends these credentials
 * automatically when the webhook was created with `auth_level: 'basic_auth'`.
 */
@Injectable()
export class KoboWebhookBasicAuthGuard implements CanActivate {
  public constructor(
    @InjectRepository(KoboEntity)
    private readonly koboRepository: Repository<KoboEntity>,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as Record<string, unknown>;
    const assetUid = body['_xform_id_string'];

    if (typeof assetUid !== 'string' || !assetUid) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }

    const koboEntity = await this.koboRepository.findOne({
      where: { assetUid: Equal(assetUid) },
      select: { webhookAuthUsername: true, webhookAuthPassword: true },
    });

    if (!koboEntity) {
      throw new HttpException(unauthorizedMessage, HttpStatus.UNAUTHORIZED);
    }

    const authHeader = request.headers['authorization'];

    const basicPrefix = 'Basic ';
    if (!authHeader?.startsWith(basicPrefix)) {
      throw new HttpException(unauthorizedMessage, HttpStatus.UNAUTHORIZED);
    }

    const base64Credentials = authHeader.slice(basicPrefix.length);
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const colonIndex = decoded.indexOf(':');

    if (colonIndex === -1) {
      throw new HttpException(unauthorizedMessage, HttpStatus.UNAUTHORIZED);
    }

    const username = decoded.slice(0, colonIndex);
    const password = decoded.slice(colonIndex + 1);

    // This exception is needed in testing as the mock service is stateless and cannot store the generated credentials, so we use fixed dummy credentials in development environment to allow the tests to pass
    if (IS_DEVELOPMENT) {
      if (username === 'success' && password === 'success') {
        return true;
      }
    }

    if (
      username !== koboEntity.webhookAuthUsername ||
      password !== koboEntity.webhookAuthPassword
    ) {
      throw new HttpException(unauthorizedMessage, HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
