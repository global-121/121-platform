import { Injectable } from '@nestjs/common';

@Injectable()
export class TwilioService {
  public fetchPhoneNumber(phoneNumber: string): {
    phoneNumber: string;
    nationalFormat: string;
  } {
    console.log('phoneNumber: ', phoneNumber);
    if (!phoneNumber) {
      phoneNumber = '+31600000000';
    }

    return {
      phoneNumber: phoneNumber,
      nationalFormat: phoneNumber,
    };
  }
}
