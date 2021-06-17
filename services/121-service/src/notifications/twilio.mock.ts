/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@nestjs/common';
import {
  TwilioMessagesCreateDto,
  TwilioValidateRequestDto,
} from './twilio.dto';

@Injectable()
export class TwilioClientMock {
  public messages;
  public constructor() {
    this.messages = new this.Messages();
  }

  public Messages = class {
    public async create(
      twilioMessagesCreateDto: TwilioMessagesCreateDto,
    ): Promise<object> {
      console.log('TwilioClientMock: create():', twilioMessagesCreateDto);
      const response = {
        body: twilioMessagesCreateDto.body,
        numSegments: twilioMessagesCreateDto.mediaUrl ? '1' : '0',
        direction: 'outbound-api',
        from: twilioMessagesCreateDto.from,
        to: twilioMessagesCreateDto.to,
        dateUpdated: new Date(),
        price: null,
        errorMessage: null,
        uri: `/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages/${twilioMessagesCreateDto.messagingServiceSid}.json`,
        accountSid: process.env.TWILIO_SID,
        numMedia: twilioMessagesCreateDto.mediaUrl ? '1' : '0',
        status: 'accepted',
        messagingServiceSid: twilioMessagesCreateDto.messagingServiceSid,
        sid: twilioMessagesCreateDto.messagingServiceSid,
        dateSent: null,
        dateCreated: new Date(),
        errorCode: null,
        priceUnit: null,
        apiVersion: '2010-04-01',
        subresourceUris: {
          media: `/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages/${twilioMessagesCreateDto.messagingServiceSid}/Media.json`,
        },
      };
      console.log('TwilioiClientMock create(): response:', response);
      return response;
    }
  };

  public validateRequest(
    twilioValidateRequestDto: TwilioValidateRequestDto,
  ): boolean {
    return true;
  }
}
