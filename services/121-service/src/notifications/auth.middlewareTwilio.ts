import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { twilioClient, twilio } from './twilio.client';
import { InjectRepository } from '@nestjs/typeorm';
import { TwilioMessageEntity } from './twilio.entity';
import { Repository } from 'typeorm';
import bodyParser = require('body-parser');
import { SmsService, callbackUrl } from './sms/sms.service';
import { TWILIO } from '../secrets';


@Injectable()
export class AuthMiddlewareTwilio implements NestMiddleware {
  constructor(private readonly smsService: SmsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const twilioSignature = req.headers['x-twilio-signature'];;
    const valid = twilio.validateRequest(
      TWILIO.authToken,
      twilioSignature,
      callbackUrl,
      req.body,
    );
    if (valid) {
      next();
    } else {
      throw new HttpException(
        'Could not validate request',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
