import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { twilioClient, twilio } from './twilio.client';
import { TWILIO } from '../secrets';
import { TWILIO_API } from '../config';

@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  public constructor() {}

  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    const twilioSignature = req.headers['x-twilio-signature'];
    const validSms = twilio.validateRequest(
      TWILIO.authToken,
      twilioSignature,
      TWILIO_API.callbackUrlSms,
      req.body,
    );
    if (validSms) {
      next();
    }

    const validVoice = twilio.validateRequest(
      TWILIO.authToken,
      twilioSignature,
      TWILIO_API.callbackUrlVoice,
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
