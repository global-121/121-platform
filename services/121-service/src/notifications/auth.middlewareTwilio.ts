import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NextFunction, Request, Response } from 'express';
import twilio from 'twilio';

import { EXTERNAL_API } from '@121-service/src/config';
import { shouldBeEnabled } from '@121-service/src/utils/env-variable.helpers';

@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (shouldBeEnabled(process.env.MOCK_TWILIO)) {
      return next();
    }

    let twilioSignature: string | string[] | undefined =
      req.headers['x-twilio-signature'];
    if (Array.isArray(twilioSignature)) {
      twilioSignature = twilioSignature[0];
    }
    if (!twilioSignature) {
      throw new HttpException(
        'Twilio signature not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!process.env.TWILIO_AUTHTOKEN) {
      throw new Error('Twilio auth token not found');
    }

    const validWhatsAppStatus = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppStatus,
      req.body,
    );
    if (validWhatsAppStatus) {
      return next();
    }

    const validWhatsAppIncoming = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppIncoming,
      req.body,
    );
    if (validWhatsAppIncoming) {
      return next();
    }

    const validSms = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
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
