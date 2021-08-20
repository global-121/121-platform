import { API_PATHS, BASE_PATH, EXTERNAL_API, PORT } from './../config';
/* eslint-disable @typescript-eslint/camelcase */
import { HttpService, Injectable, Post } from '@nestjs/common';
import {
  TwilioMessagesCreateDto,
  TwilioStatusCallbackDto,
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

      const messageSid = 'SM' + this.createRandomHexaDecimalString(32);

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
        sid: messageSid,
        dateSent: null,
        dateCreated: new Date(),
        errorCode: null,
        priceUnit: null,
        apiVersion: '2010-04-01',
        subresourceUris: {
          media: `/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages/${twilioMessagesCreateDto.messagingServiceSid}/Media.json`,
        },
      };
      console.log('TwilioClientMock create(): response:', response);
      this.sendStatusResponse(twilioMessagesCreateDto, messageSid);
      return response;
    }

    private createRandomHexaDecimalString(length: number): string {
      let result = '';
      const characters = 'abcdef0123456789';
      const charactersLength = characters.length;

      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength),
        );
      }

      return result;
    }

    private async sendStatusResponse(
      twilioMessagesCreateDto: TwilioMessagesCreateDto,
      messageSid: string,
    ): Promise<void> {
      if (twilioMessagesCreateDto.from.includes('whatsapp')) {
        console.log('twilioMessagesCreateDto: ', twilioMessagesCreateDto);

        await new Promise(r => setTimeout(r, 3000));
        const request = new TwilioStatusCallbackDto();
        request.MessageSid = messageSid;
        request.MessageStatus = 'delivered';
        const httpService = new HttpService();
        try {
          await httpService
            .post(EXTERNAL_API.whatsAppStatus, request)
            .toPromise();
        } catch (error) {
          // In case external API is not reachable try localhost
          const urlLocalhost = `http://localhost:${PORT}${BASE_PATH}/${API_PATHS.whatsAppStatus}`;
          console.log('urlLocalhost: ', urlLocalhost);
          const test = await httpService
            .post(urlLocalhost, request)
            .toPromise();
          console.log('test: ', test);
        }
      }
    }
  };

  public validateRequest(
    twilioValidateRequestDto: TwilioValidateRequestDto,
  ): boolean {
    console.log(
      'TwilioClientMock: validateRequest():',
      twilioValidateRequestDto,
    );
    return true;
  }
}
