import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  TwilioIncomingCallbackDto,
  TwilioMessagesCreateDto,
  TwilioStatus,
  TwilioStatusCallbackDto,
} from './twilio.dto';
import { API_PATHS, EXTERNAL_API } from '../config';
import { lastValueFrom } from 'rxjs';
import { setTimeout } from 'node:timers/promises';

@Injectable()
export class TwilioService {
  public fetchPhoneNumber(phoneNumber: string): {
    phoneNumber: string;
    nationalFormat: string;
  } {
    if (!phoneNumber) {
      phoneNumber = '+31600000000';
    }

    return {
      phoneNumber: phoneNumber,
      nationalFormat: phoneNumber,
    };
  }

  public createMessage(
    twilioMessagesCreateDto: TwilioMessagesCreateDto,
  ): object {
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
      ['payment-templated', 'generic-templated'].includes(
        twilioMessagesCreateDto.messageContentType,
      ) &&
      !twilioMessagesCreateDto.to.includes('15005550002')
    ) {
      this.sendIncomingWhatsapp(twilioMessagesCreateDto, messageSid).catch(
        (e) => {
          console.log('TWILIO MOCK: Error sending incoming whatsapp ', e);
        },
      );
    }

    // await waitFor(30); // no longer needed when this is a separate service?
    return response;
  }

  private createRandomHexaDecimalString(length: number): string {
    let result = '';
    const characters = 'abcdef0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
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
      const urlExternal = twilioMessagesCreateDto.to.includes('whatsapp')
        ? EXTERNAL_API.whatsAppStatus
        : EXTERNAL_API.smsStatus;

      try {
        // Try to reach 121-service through external API url
        await lastValueFrom(httpService.post(urlExternal, request));
      } catch (error) {
        // In case external API is not reachable try internal network
        const path = twilioMessagesCreateDto.to.includes('whatsapp')
          ? API_PATHS.whatsAppStatus
          : API_PATHS.smsStatus;
        const urlInternal = `${EXTERNAL_API.rootApi}/${path}`;
        await lastValueFrom(httpService.post(urlInternal, request)).catch(
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
      await setTimeout(3000);
      const request = new TwilioIncomingCallbackDto();
      request.MessageSid = messageSid;
      request.From = twilioMessagesCreateDto.to;
      request.To = process.env.TWILIO_WHATSAPP_NUMBER;
      const httpService = new HttpService();
      try {
        // Try to reach 121-service through external API url
        await lastValueFrom(
          httpService.post(EXTERNAL_API.whatsAppIncoming, request),
        );
      } catch (error) {
        // In case external API is not reachable try internal network
        const urlInternal = `${EXTERNAL_API.rootApi}/${API_PATHS.whatsAppIncoming}`;
        await lastValueFrom(httpService.post(urlInternal, request)).catch(
          (error) => console.log(error),
        );
      }
    }
  }
}
