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
    phone_number: string;
    national_format: string;
  } {
    if (!phoneNumber) {
      phoneNumber = '+31600000000';
    }

    return {
      phone_number: phoneNumber,
      national_format: phoneNumber,
    };
  }

  public createMessage(
    twilioMessagesCreateDto: TwilioMessagesCreateDto,
    accountSid: string,
    ): object {
    const messageSid = 'SM' + this.createRandomHexaDecimalString(32);
    const response = {
      body: twilioMessagesCreateDto.Body,
      numSegments: twilioMessagesCreateDto.MediaUrl ? '1' : '0',
      direction: 'outbound-api',
      from: twilioMessagesCreateDto.From,
      to: twilioMessagesCreateDto.To,
      dateUpdated: new Date(),
      price: null,
      error_message: null,
      uri: `/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages/${twilioMessagesCreateDto.MessagingServiceSid}.json`,
      account_sid: accountSid,
      numMedia: twilioMessagesCreateDto.MediaUrl ? '1' : '0',
      status: 'accepted',
      messaging_service_sid: twilioMessagesCreateDto.MessagingServiceSid,
      sid: messageSid,
      date_sent: null,
      date_created: new Date(),
      error_code: null,
      price_unit: null,
      api_version: '2010-04-01',
      subresourceUris: {
        media: `/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages/${twilioMessagesCreateDto.MessagingServiceSid}/Media.json`,
      },
    };
    if (twilioMessagesCreateDto.To.includes('15005550001')) {
      response.status = TwilioStatus.failed;
      response.error_code = '1';
      response.error_message = 'Magic fail';
      this.sendStatusResponse121(
        twilioMessagesCreateDto,
        messageSid,
        TwilioStatus.failed,
      ).catch((e) => {
        console.log('TWILIO MOCK: Error sending status response: ', e);
      });
    } else {
      let statuses = [];
      if (twilioMessagesCreateDto.To.includes('whatsapp')) {
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
    let isYesMessage = false;
    for (const messageType of ['payment-templated', 'generic-templated']) {
      if (twilioMessagesCreateDto.StatusCallback.includes(messageType)) {
        isYesMessage = true;
      }
    }

    if (isYesMessage && !twilioMessagesCreateDto.To.includes('15005550002')) {
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
    const request = new TwilioStatusCallbackDto();
    request.MessageSid = messageSid;
    request.MessageStatus = status;

    if (twilioMessagesCreateDto.To.includes('15005550001')) {
      request.ErrorCode = '1';
      request.ErrorMessage = 'Magic fail';
    }
    const httpService = new HttpService();
    const urlExternal = twilioMessagesCreateDto.To.includes('whatsapp')
      ? EXTERNAL_API.whatsAppStatus
      : EXTERNAL_API.smsStatus;

    try {
      // Try to reach 121-service through external API url
      await lastValueFrom(httpService.post(urlExternal, request));
    } catch (error) {
      // In case external API is not reachable try internal network
      const path = twilioMessagesCreateDto.To.includes('whatsapp')
        ? API_PATHS.whatsAppStatus
        : API_PATHS.smsStatus;
      const urlInternal = `${EXTERNAL_API.rootApi}/${path}`;
      await lastValueFrom(httpService.post(urlInternal, request)).catch(
        (error) => console.log(error),
      );
    }
  }

  private async sendIncomingWhatsapp(
    twilioMessagesCreateDto: TwilioMessagesCreateDto,
    messageSid: string,
  ): Promise<void> {
    if (
      twilioMessagesCreateDto.From &&
      twilioMessagesCreateDto.From.includes('whatsapp')
    ) {
      await setTimeout(3000);
      const request = new TwilioIncomingCallbackDto();
      request.MessageSid = messageSid;
      request.From = twilioMessagesCreateDto.To;
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
