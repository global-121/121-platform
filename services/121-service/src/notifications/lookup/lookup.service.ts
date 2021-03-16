import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { twilioClient } from '../twilio.client';

@Injectable()
export class LookupService {
  public constructor() {}

  public async lookupPhoneNr(phoneNumber: string): Promise<any> {
    let numberCorrect: boolean;
    try {
      await twilioClient.lookups
        .phoneNumbers(phoneNumber)
        .fetch({ type: ['carrier'] });
      numberCorrect = true;
    } catch (e) {
      if (e.status === HttpStatus.NOT_FOUND) {
        numberCorrect = false;
      }
    }
    return { result: numberCorrect };
  }

  public async lookupAndCorrect(
    phoneNumber: string,
    throwNoException?: boolean,
  ): Promise<string> {
    try {
      // Add additional sanitizing (incl NL-specific) because user is given no opportunity to correct here
      const updatedPhone = this.sanitizePhoneNrExtra(phoneNumber);

      const lookupResponse = await twilioClient.lookups
        .phoneNumbers(updatedPhone)
        .fetch({ type: ['carrier'] });
      return lookupResponse.phoneNumber.replace(/\D/g, '');
    } catch (e) {
      console.log('e: ', e);
      if (throwNoException) {
        return;
      }
      if (e.status === HttpStatus.NOT_FOUND) {
        const errors = `Phone number incorrect`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }
  }

  private sanitizePhoneNrExtra(phoneNumber: string): string {
    return phoneNumber.substr(0, 2) == '00'
      ? phoneNumber.substr(2, phoneNumber.length - 2)
      : phoneNumber.substr(0, 2) == '06'
      ? '31' + phoneNumber
      : phoneNumber.substr(0, 3) == '+00'
      ? phoneNumber.substr(3, phoneNumber.length - 3)
      : phoneNumber.substr(0, 2) == '+0'
      ? phoneNumber.substr(2, phoneNumber.length - 2)
      : phoneNumber;
  }
}
