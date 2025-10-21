import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NextFunction, Request, Response } from 'express';
import twilio from 'twilio';

import { EXTERNAL_API } from '@121-service/src/config';
import { env } from '@121-service/src/env';

@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (env.MOCK_TWILIO) {
      return next();
    }

    let twilioSignature: string | string[] | undefined =
      req.(headers as any)['x-twilio-signature'];
    if (Array.isArray(twilioSignature)) {
      twilioSignature = twilioSignature[0];
    }
    if (!twilioSignature) {
      throw new HttpException(
        'Twilio signature not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const validWhatsAppStatus = twilio.validateRequest(
      env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppStatus,
      req.body,
    );
    if (validWhatsAppStatus) {
      return next();
    }

    const validWhatsAppIncoming = twilio.validateRequest(
      env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppIncoming,
      req.body,
    );
    if (validWhatsAppIncoming) {
      return next();
    }

    const validSms = twilio.validateRequest(
      env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.smsStatus,
      req.body,
    );
    if (validSms) {
      return next();
    }

    throw new HttpException(
      'Could not validate Twilio request',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
