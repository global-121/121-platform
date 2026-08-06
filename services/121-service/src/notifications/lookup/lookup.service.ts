import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { TwilioMode } from '@121-service/src/notifications/enum/twilio-mode.enum';
import { twilioClient } from '@121-service/src/notifications/twilio.client';

@Injectable()
export class LookupService {
  public async lookupAndCorrect(
    phoneNumber: string,
    throwNoException: true,
  ): Promise<string | undefined>;
  public async lookupAndCorrect(
    phoneNumber: string,
    throwNoException?: false,
  ): Promise<string>;
  public async lookupAndCorrect(
    phoneNumber: string,
    throwNoException?: boolean,
  ): Promise<string | undefined> {
    if (env.TWILIO_MODE === TwilioMode.disabled) {
      return this.sanitizePhoneNrExtra(phoneNumber).replace(/\D/g, '');
    }
    try {
      // Add additional sanitizing (including NL-specific) because user is given no opportunity to correct here
      const updatedPhone = this.sanitizePhoneNrExtra(phoneNumber);

      const lookupResponse = await twilioClient.lookups.v1
        .phoneNumbers(updatedPhone)
        .fetch({ type: ['carrier'] });

      return lookupResponse.phoneNumber.replace(/\D/g, '');
    } catch (e) {
      if (throwNoException) {
        return;
      }
      if (e.status === HttpStatus.NOT_FOUND) {
        const errors = `Phone number incorrect`;
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
    }
    return;
  }

  public sanitizePhoneNrExtra(phoneNumber: string): string {
    const sanitizedPhoneNr =
      phoneNumber.substring(0, 2) == '00'
        ? phoneNumber.substring(2)
        : phoneNumber.substring(0, 3) == '+00'
          ? phoneNumber.substring(3)
          : phoneNumber.substring(0, 2) == '+0'
            ? phoneNumber.substring(2)
            : phoneNumber.substring(0, 1) == '+'
              ? phoneNumber.substring(1)
              : phoneNumber;
    return `+${sanitizedPhoneNr}`;
  }
}
