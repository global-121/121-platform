/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@nestjs/common';
import {
  TwilioCallsCreateDto,
  TwilioMessagesCreateDto,
  TwilioValidateRequestDto,
} from './twilio.dto';

@Injectable()
export class TwilioClientMock {
  public messages;
  public lookups;
  public calls;
  public constructor() {
    this.messages = new this.Messages();
    this.lookups = new this.Lookups();
    this.calls = new this.Calls();
  }

  public Messages = class {
    public async create(
      twilioMessagesCreateDto: TwilioMessagesCreateDto,
    ): Promise<object> {
      return {
        body: twilioMessagesCreateDto.body,
        numSegments: twilioMessagesCreateDto.mediaUrl ? '1' : '0',
        direction: 'outbound-api',
        from: twilioMessagesCreateDto.from,
        to: twilioMessagesCreateDto.to,
        dateUpdated: new Date(),
        price: null,
        errorMessage: null,
        uri:
          '/2010-04-01/Accounts/ACc6b5fa2276ff6b64cdbed0099fd9bc0b/Messages/SM2659aa9303394e01b30f33cbd92c4cf3.json',
        accountSid: 'ACc6b5fa2276ff6b64cdbed0099fd9bc0b',
        numMedia: twilioMessagesCreateDto.mediaUrl ? '1' : '0',
        status: 'accepted',
        messagingServiceSid: twilioMessagesCreateDto.messagingServiceSid,
        sid: 'SM2659aa9303394e01b30f33cbd92c4cf3',
        dateSent: null,
        dateCreated: new Date(),
        errorCode: null,
        priceUnit: null,
        apiVersion: '2010-04-01',
        subresourceUris: {
          media:
            '/2010-04-01/Accounts/ACc6b5fa2276ff6b64cdbed0099fd9bc0b/Messages/SM2659aa9303394e01b30f33cbd92c4cf3/Media.json',
        },
      };
    }
  };

  public Calls = class {
    public async create(
      twilioCallsCreateDto: TwilioCallsCreateDto,
    ): Promise<object> {
      console.log('twilioCallsCreateDto: ', twilioCallsCreateDto);
      return {
        accountSid: 'ACc6b5fa2276ff6b64cdbed0099fd9bc0b',
        to: twilioCallsCreateDto.to,
        from: twilioCallsCreateDto.from,
        sid: 'SM2659aa9303394e01b30f33cbd92c4cf3',
        status: 'accepted',
      };
    }
  };

  public Lookups = class {
    public phoneNumbers(phoneNumber: string): object {
      return {
        callerName: null,
        countryCode: 'US',
        phoneNumber: phoneNumber,
        nationalFormat: '(510) 867-5310',
        carrier: {
          mobile_country_code: '311',
          mobile_network_code: '880',
          name: 'Sprint Spectrum, L.P.',
          type: 'mobile',
          error_code: null,
        },
        addOns: null,
        url: `https://lookups.twilio.com/v1/PhoneNumbers/${phoneNumber}?Type=carrier`,
      };
    }
  };

  public validateRequest(
    twilioValidateRequestDto: TwilioValidateRequestDto,
  ): boolean {
    return true;
  }
}
