import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import {
  API_PATHS,
  DEVELOPMENT,
  EXTERNAL_API_ROOT,
} from '@mock-service/src/config';
import {
  TwilioIncomingCallbackDto,
  TwilioMessagesCreateDto,
  TwilioStatus,
  TwilioStatusCallbackDto,
} from '@mock-service/src/twilio/twilio.dto';
import { formatWhatsAppNumber } from '@mock-service/src/utils/phone-number.helpers';
import { createCancelableTimeout as setTimeoutQueue } from '@mock-service/src/utils/timout.helpers';

// Use any other phone-number to trigger a successful response
enum MockPhoneNumbers {
  FailGeneric = '15005550001',
  // below numbers start with '16..' to avoid confusion with real Twilio test numbers (https://www.twilio.com/docs/iam/test-credentials#test-sms-messages-parameters-From)
  NoIncomingYesMessage = '16005550002',
  FailFaultyTemplateError = '16005550003',
  FailNoWhatsAppNumber = '16005550004',
}

// See: services/121-service/src/notifications/enum/message-type.enum.ts
const TemplatedMessages = ['generic-templated', 'payment-templated'];

@Injectable()
export class TwilioService {
  public async fetchPhoneNumber(phoneNumber: string): Promise<{
    phone_number: string;
    national_format: string;
  }> {
    if (!phoneNumber) {
      phoneNumber = '+31600000000';
    }
    await setTimeoutQueue(400); // This is the average time of an actual twilio lookup
    return {
      phone_number: phoneNumber,
      national_format: phoneNumber,
    };
  }

  public createMessage(
    twilioMessagesCreateDto: TwilioMessagesCreateDto,
    accountSid: string,
  ): Record<string, unknown> {
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
      uri: `/2010-04-01/Accounts/${accountSid}/Messages/${twilioMessagesCreateDto.MessagingServiceSid}.json`,
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
        media: `/2010-04-01/Accounts/${accountSid}/Messages/${twilioMessagesCreateDto.MessagingServiceSid}/Media.json`,
      },
      userId: 1,
    };

    // 1. First loop through different error rseponses and return early
    if (
      !twilioMessagesCreateDto.To ||
      twilioMessagesCreateDto.To.includes(MockPhoneNumbers.FailGeneric)
    ) {
      response.status = TwilioStatus.failed;
      response.error_code = '1';
      response.error_message = 'Magic fail';
      this.sendDelayedStatusCallback121({
        twilioMessagesCreateDto,
        messageSid,
        response,
      });
      return response;
    }

    if (
      twilioMessagesCreateDto.To.includes(
        MockPhoneNumbers.FailFaultyTemplateError,
      ) &&
      twilioMessagesCreateDto.To.includes('whatsapp') && // only return this error on whatsapp
      !twilioMessagesCreateDto.StatusCallback.includes('templated') // only return this error on non-templated messages
    ) {
      response.status = TwilioStatus.undelivered;
      response.error_code = '63016';
      response.error_message =
        'Failed to send freeform message because you are outside the allowed window. If you are using WhatsApp, please use a Message Template.';
      this.sendDelayedStatusCallback121({
        twilioMessagesCreateDto,
        messageSid,
        response,
      });
      return response;
    }

    if (
      twilioMessagesCreateDto.To.includes(
        MockPhoneNumbers.FailNoWhatsAppNumber,
      ) &&
      twilioMessagesCreateDto.To.includes('whatsapp') // only return this error on whatsapp
    ) {
      response.status = TwilioStatus.failed;
      response.error_code = '63003';
      response.error_message =
        'Channel could not find To address. You have tried to send a message to a To address that is inactive or invalid.';
      this.sendDelayedStatusCallback121({
        twilioMessagesCreateDto,
        messageSid,
        response,
      });
      return response;
    }

    // 2. else, send (multiple) success status reponses
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
    this.sendMultipleSuccessStatusCallbacks({
      twilioMessagesCreateDto,
      messageSid,
      response,
      statuses,
    });

    // 3. and if applicable, send incoming whatsapp reply
    let isYesMessage = false;
    for (const messageType of TemplatedMessages) {
      if (twilioMessagesCreateDto.StatusCallback.includes(messageType)) {
        isYesMessage = true;
      }
    }
    if (
      isYesMessage &&
      !twilioMessagesCreateDto.To.includes(
        MockPhoneNumbers.NoIncomingYesMessage,
      )
    ) {
      this.sendIncomingWhatsapp({ twilioMessagesCreateDto, messageSid });
    }

    return response;
  }

  private sendMultipleSuccessStatusCallbacks({
    twilioMessagesCreateDto,
    messageSid,
    response,
    statuses,
  }: {
    twilioMessagesCreateDto: TwilioMessagesCreateDto;
    messageSid: string;
    response;
    statuses: TwilioStatus[];
  }): void {
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      const modifiedResponse = { ...response };
      modifiedResponse.status = status;

      setTimeout(
        () => {
          this.sendDelayedStatusCallback121({
            twilioMessagesCreateDto,
            messageSid,
            response: modifiedResponse,
          });
        },
        250 * (i + 1),
      );
    }
  }

  private sendDelayedStatusCallback121({
    twilioMessagesCreateDto,
    messageSid,
    response,
  }: {
    twilioMessagesCreateDto: TwilioMessagesCreateDto;
    messageSid: string;
    response;
  }): void {
    const request = new TwilioStatusCallbackDto();
    request.MessageSid = messageSid;
    request.MessageStatus = response.status;
    request.ErrorCode = response.error_code;
    request.ErrorMessage = response.error_message;

    let url = twilioMessagesCreateDto.StatusCallback;

    if (DEVELOPMENT) {
      const path = twilioMessagesCreateDto.To.includes('whatsapp')
        ? API_PATHS.whatsAppStatus
        : API_PATHS.smsStatus;
      url = `${EXTERNAL_API_ROOT}/${path}`;
      console.log(messageSid, response.status);
    }

    // This is to simulate a delay in the callback
    // and to avoid the Twilio service to send the status callback
    // before the message is processed in the 121 service
    //
    // It cannot be done within a promise / await because
    // otherwise the 121 service will be waiting for this to happen
    // before creating the message entity in the db.
    setTimeout(() => {
      const httpService = new HttpService();
      lastValueFrom(httpService.post(url, request)).catch((error) =>
        console.log('TWILIO MOCK: Error sending status response: ', error),
      );
    }, 250);
  }

  private sendIncomingWhatsapp({
    twilioMessagesCreateDto,
    messageSid,
  }: {
    twilioMessagesCreateDto: TwilioMessagesCreateDto;
    messageSid: string;
  }): void {
    if (
      twilioMessagesCreateDto.From &&
      twilioMessagesCreateDto.From.includes('whatsapp')
    ) {
      const request = new TwilioIncomingCallbackDto();
      request.MessageSid = messageSid;
      request.From = twilioMessagesCreateDto.To;
      request.To = formatWhatsAppNumber(twilioMessagesCreateDto.From);

      const url = DEVELOPMENT
        ? `${EXTERNAL_API_ROOT}/${API_PATHS.whatsAppIncoming}`
        : twilioMessagesCreateDto.StatusCallback.replace(
            API_PATHS.whatsAppStatus,
            API_PATHS.whatsAppIncoming,
          );

      // This is to simulate a delay in the callback
      // and to avoid the Twilio service to send the status callback
      // before the message is processed in the 121 service
      //
      // It cannot be done within a promise / await because
      // otherwise the 121 service will be waiting for this to happen
      // before creating the message entity in the db.
      setTimeout(() => {
        const httpService = new HttpService();
        lastValueFrom(httpService.post(url, request)).catch((error) =>
          console.error('TWILIO MOCK: Error sending incoming whatsapp ', error),
        );
      }, 1000);
    }
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
}
