import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { twilio } from './twilio.client';
import { EXTERNAL_API } from '../config';

@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  public constructor() {}

  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    const twilioSignature = req.headers['x-twilio-signature'];

    const validWhatsapp = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppStatus,
      req.body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );
    if (validWhatsapp) {
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
      'Could not validate Twillio request',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
