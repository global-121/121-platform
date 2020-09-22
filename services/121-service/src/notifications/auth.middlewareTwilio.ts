import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { twilio } from './twilio.client';
import { TWILIO } from '../secrets';
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
    const validSms = twilio.validateRequest(
      TWILIO.tokenSecret,
      twilioSignature,
      EXTERNAL_API.callbackUrlSms,
      req.body,
      {
        accountSid: TWILIO.sid,
      },
    );
    if (validSms) {
      next();
    }

    const validVoice = twilio.validateRequest(
      TWILIO.tokenSecret,
      twilioSignature,
      EXTERNAL_API.callbackUrlVoice,
      req.body,
    );
    if (validVoice) {
      next();
    }

    next();

    if (!validSms && !validVoice)
      throw new HttpException(
        'Could not validate Twillio request',
        HttpStatus.UNAUTHORIZED,
      );
  }
}
