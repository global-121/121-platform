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
    // console.log('Twillio auth');
    const twilioSignature = req.headers['x-twilio-signature'];

    const validWhatsapp = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.callbackUrlWhatsapp,
      req.body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );
    if (validWhatsapp) {
      next();
    }

    const validSms = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.callbackUrlSms,
      req.body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );
    if (validSms) {
      next();
    }

    const validVoice = twilio.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.callbackUrlVoice,
      req.body,
    );
    if (validVoice) {
      next();
    }

    if (!validSms && !validVoice)
      throw new HttpException(
        'Could not validate Twillio request',
        HttpStatus.UNAUTHORIZED,
      );
  }
}
