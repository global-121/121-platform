import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NextFunction, Request, Response } from 'express';
import twilio from 'twilio';

import { EXTERNAL_API } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';

@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (env.TWILIO_MODE === TwilioMode.mock) {
      return next();
    }

    if (env.TWILIO_MODE === TwilioMode.disabled) {
      throw new HttpException(
        'Twilio is disabled, cannot accept incoming requests',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // When TWILIO_MODE is EXTERNAL, validate the request signature to ensure it comes from Twilio.
    // The env is always set as we validate this in startup
    const authToken = env.TWILIO_AUTHTOKEN!;

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

    const validWhatsAppStatus = twilio.validateRequest(
      authToken,
      twilioSignature,
      EXTERNAL_API.whatsAppStatus,
      req.body,
    );
    if (validWhatsAppStatus) {
      return next();
    }

    const validWhatsAppIncoming = twilio.validateRequest(
      authToken,
      twilioSignature,
      EXTERNAL_API.whatsAppIncoming,
      req.body,
    );
    if (validWhatsAppIncoming) {
      return next();
    }

    const validSms = twilio.validateRequest(
      authToken,
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
