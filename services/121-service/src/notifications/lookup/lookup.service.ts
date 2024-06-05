import { twilioClient } from '@121-service/src/notifications/twilio.client';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

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
    try {
      // Add additional sanitizing (incl NL-specific) because user is given no opportunity to correct here
      const updatedPhone = this.sanitizePhoneNrExtra(phoneNumber);

      const lookupResponse = await twilioClient.lookups.v1
        .phoneNumbers(updatedPhone)
        .fetch({ type: ['carrier'] });
      if (lookupResponse.phoneNumber.substr(0, 4) == '+961') {
        lookupResponse.phoneNumber =
          this.processLebanonException(lookupResponse);
      }
      return lookupResponse.phoneNumber.replace(/\D/g, '');
    } catch (e) {
      console.log('e: ', e);
      if (throwNoException) {
        return;
      }
      if (e.status === HttpStatus.NOT_FOUND) {
        const errors = `Phone number incorrect`;
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
    }
  }

  public async getLocalNumber(
    phoneNumber: string,
  ): Promise<number | undefined> {
    try {
      // Add additional sanitizing (incl NL-specific) because user is given no opportunity to correct here
      const updatedPhone = this.sanitizePhoneNrExtra(phoneNumber);

      const lookupResponse = await twilioClient.lookups.v1
        .phoneNumbers(updatedPhone)
        .fetch({ type: ['carrier'] });
      return Number(lookupResponse.nationalFormat.replace(/\s/g, ''));
    } catch (e) {
      if (e.status === HttpStatus.NOT_FOUND) {
        const errors = `Phone number incorrect`;
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private processLebanonException(lookupResponse): string {
    if (lookupResponse.nationalFormat.substr(0, 1) == '0') {
      return lookupResponse.phoneNumber.replace('+961', '+9610');
    } else {
      return lookupResponse.phoneNumber;
    }
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
