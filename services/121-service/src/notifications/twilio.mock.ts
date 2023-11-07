import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { EXTERNAL_API } from './../config';
import { TwilioMessagesCreateDto } from './twilio.dto';
import { CustomHttpService } from '../shared/services/custom-http.service';

class PhoneNumbers {
  public phoneNumber;
  public constructor(
    phoneNumber = '+31600000000',
    private readonly customHttpService: CustomHttpService,
  ) {
    this.phoneNumber = phoneNumber;
  }
  public async fetch(_: any): Promise<any> {
    return (
      await this.customHttpService.get<any>(
        `${process.env.TWILIO_MOCK_SERVICE_URL}api/lookups/phonenumbers?phoneNumber=${this.phoneNumber}`,
      )
    ).data;
  }
}

class LookUps {
  public constructor(private readonly customHttpService: CustomHttpService) {}
  public phoneNumbers(nr): any {
    return new PhoneNumbers(nr, this.customHttpService);
  }
}

class Messages {
  public constructor(private readonly customHttpService: CustomHttpService) {}
  public async create(
    twilioMessagesCreateDto: TwilioMessagesCreateDto,
  ): Promise<object> {
    return (
      await this.customHttpService.post<any>(
        `${process.env.TWILIO_MOCK_SERVICE_URL}api/messages`,
        twilioMessagesCreateDto,
      )
    ).data;
  }
}

@Injectable()
export class TwilioClientMock {
  public messages: Messages;
  public lookups: LookUps;
  public httpService: HttpService;
  public customHttpService: CustomHttpService;
  public constructor() {
    this.httpService = new HttpService();
    this.customHttpService = new CustomHttpService(this.httpService);
    this.messages = new Messages(this.customHttpService);
    this.lookups = new LookUps(this.customHttpService);
  }

  public validateRequest(
    _authtoken,
    twilioSignature,
    _url,
    body,
  ): // twilioValidateRequestDto: TwilioValidateRequestDto,
  boolean {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilioValidator = require('twilio');
    twilioValidator.validateRequest(
      process.env.TWILIO_AUTHTOKEN,
      twilioSignature,
      EXTERNAL_API.whatsAppIncoming,
      body,
      {
        accountSid: process.env.TWILIO_SID,
      },
    );

    return true;
  }
}
