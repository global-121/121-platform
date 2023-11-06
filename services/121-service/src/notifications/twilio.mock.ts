import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { IntersolveVoucherPayoutStatus } from '../payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { API_PATHS, EXTERNAL_API } from './../config';
import {
  TwilioIncomingCallbackDto,
  TwilioMessagesCreateDto,
  TwilioStatus,
  TwilioStatusCallbackDto,
} from './twilio.dto';
import { waitFor } from '../utils/waitFor.helper';
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
    return this.customHttpService.get<{
      phoneNumber: string;
      nationalFormat: string;
    }>(
      `${process.env.TWILIO_MOCK_SERVICE_URL}api/lookups/phonenumbers?phoneNumber=${this.phoneNumber}`,
    );
  }
}

class LookUp {
  public constructor(private readonly customHttpService: CustomHttpService) {}
  public phoneNumbers(nr): any {
    return new PhoneNumbers(nr, this.customHttpService);
  }
}

@Injectable()
export class TwilioClientMock {
  public messages;
  public lookups;
  public httpService;
  public customHttpService;
  public constructor() {
    this.httpService = new HttpService();
    this.customHttpService = new CustomHttpService(this.httpService);
    this.messages = new this.Messages();
    this.lookups = new LookUp(this.customHttpService);
  }

  public Messages = class {
    public async create(
      twilioMessagesCreateDto: TwilioMessagesCreateDto,
    ): Promise<object> {
      // console.log('TwilioClientMock: create():', twilioMessagesCreateDto);

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
      if (twilioMessagesCreateDto.to.includes('15005550001')) {
        response.status = TwilioStatus.failed;
        response.errorCode = '1';
        response.errorMessage = 'Magic fail';
        this.sendStatusResponse121(
          twilioMessagesCreateDto,
          messageSid,
          TwilioStatus.failed,
        ).catch((e) => {
          console.log('TWILIO MOCK: Error sending status response: ', e);
        });
      } else {
        let statuses = [];
        if (twilioMessagesCreateDto.to.includes('whatsapp')) {
          statuses = [
            TwilioStatus.queued,
            TwilioStatus.sent,
            TwilioStatus.delivered,
            TwilioStatus.read,
          ];
        } else {
          statuses = [TwilioStatus.queued, TwilioStatus.sent];
        }
        for (const status of statuses) {
          this.sendStatusResponse121(
            twilioMessagesCreateDto,
            messageSid,
            status,
          ).catch((e) => {
            console.log('TWILIO MOCK: Error sending status response: ', e);
          });
        }
      }
      if (
        twilioMessagesCreateDto.messageType ===
          IntersolveVoucherPayoutStatus.InitialMessage &&
        !twilioMessagesCreateDto.to.includes('15005550002')
      ) {
        this.sendIncomingWhatsapp(twilioMessagesCreateDto, messageSid).catch(
          (e) => {
            console.log('TWILIO MOCK: Error sending incoming whatsapp ', e);
          },
        );
      }
      await waitFor(30);
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

    private async sendStatusResponse121(
      twilioMessagesCreateDto: TwilioMessagesCreateDto,
      messageSid: string,
      status: TwilioStatus,
    ): Promise<void> {
      if (twilioMessagesCreateDto.from) {
        const request = new TwilioStatusCallbackDto();
        request.MessageSid = messageSid;
        request.MessageStatus = status;

        if (twilioMessagesCreateDto.to.includes('15005550001')) {
          request.ErrorCode = '1';
          request.ErrorMessage = 'Magic fail';
        }
        const httpService = new HttpService();
        const url = twilioMessagesCreateDto.to.includes('whatsapp')
          ? EXTERNAL_API.whatsAppStatus
          : EXTERNAL_API.smsStatus;

        try {
          await lastValueFrom(httpService.post(url, request));
        } catch (error) {
          // In case external API is not reachable try localhost
          const path = twilioMessagesCreateDto.to.includes('whatsapp')
            ? API_PATHS.whatsAppStatus
            : API_PATHS.smsStatus;
          const urlLocalhost = `${EXTERNAL_API.rootApi}/${path}`;
          await lastValueFrom(httpService.post(urlLocalhost, request)).catch(
            (error) => console.log(error),
          );
        }
      }
    }

    private async sendIncomingWhatsapp(
      twilioMessagesCreateDto: TwilioMessagesCreateDto,
      messageSid: string,
    ): Promise<void> {
      if (
        twilioMessagesCreateDto.from &&
        twilioMessagesCreateDto.from.includes('whatsapp')
      ) {
        await waitFor(3_000);
        const request = new TwilioIncomingCallbackDto();
        request.MessageSid = messageSid;
        request.From = twilioMessagesCreateDto.to;
        request.To = process.env.TWILIO_WHATSAPP_NUMBER;
        const httpService = new HttpService();
        try {
          await lastValueFrom(
            httpService.post(EXTERNAL_API.whatsAppIncoming, request),
          );
        } catch (error) {
          // In case external API is not reachable try localhost
          const urlLocalhost = `${EXTERNAL_API.rootApi}/${API_PATHS.whatsAppIncoming}`;
          await lastValueFrom(httpService.post(urlLocalhost, request)).catch(
            (error) => console.log(error),
          );
        }
      }
    }
  };

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
