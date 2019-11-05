import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { twilioClient, twilio, callbackUrlSms, callbackUrlVoice } from './twilio.client';
import { TWILIO } from '../secrets';


@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    const twilioSignature = req.headers['x-twilio-signature'];
    const validSms = twilio.validateRequest(
      TWILIO.authToken,
      twilioSignature,
      callbackUrlSms,
      req.body,
    );
    if (validSms) {
      next();
    }

    const validVoice = twilio.validateRequest(
      TWILIO.authToken,
      twilioSignature,
      callbackUrlVoice,
      req.body,
      );
    if (validVoice) {
      next();
    }

    if (!validSms && !validVoice)
      throw new HttpException(
        'Could not validate request',
        HttpStatus.UNAUTHORIZED,
      );
  }
}
