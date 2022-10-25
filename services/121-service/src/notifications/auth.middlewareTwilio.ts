import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NextFunction, Request, Response } from 'express';
import { DEBUG, EXTERNAL_API } from '../config';
import { twilio } from './twilio.client';

@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  public constructor() {}

  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    const twilioSignature = req.headers['x-twilio-signature'];

    if (DEBUG) {
      console.info(
        'AuthMiddlewareTwilio: Skipped request validation in DEBUG-mode for:',
        req.path,
      );
      return next();
    }

    const validWhatsAppStatus = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppStatus,
      req.body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );
    if (validWhatsAppStatus) {
      return next();
    }

    const validWhatsAppIncoming = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppIncoming,
      req.body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );
    if (validWhatsAppIncoming) {
      return next();
    }

    const validSms = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.smsStatus,
      req.body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );
    if (validSms) {
      return next();
    }

    const validVoice = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.voiceStatus,
      req.body,
    );
    if (validVoice) {
      return next();
    }

    throw new HttpException(
      'Could not validate Twilio request',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
