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

  public async lookupAndCorrect(phoneNumber: string): Promise<string> {
    try {
      const lookupResponse = await twilioClient.lookups
        .phoneNumbers(phoneNumber)
        .fetch({ type: ['carrier'] });
      return lookupResponse.phoneNumber.replace(/\D/g, '');
    } catch (e) {
      console.log('e: ', e);
      if (e.status === HttpStatus.NOT_FOUND) {
        const errors = `Phone number incorrect`;
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
      }
    }
  }
}
