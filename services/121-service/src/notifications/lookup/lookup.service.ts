import { Injectable } from '@nestjs/common';
import { twilioClient } from '../twilio.client';
import { resolve } from 'path';

@Injectable()
export class LookupService {
  public constructor() {}

  public async lookupPhoneNr(phoneNumber: string): Promise<any> {
    console.log('lookup', phoneNumber);

    let numberCorrect: Boolean

    try {
      const result  = await twilioClient.lookups
      .phoneNumbers(phoneNumber)
      .fetch({ type: ['carrier'] })
      console.log(result)
      numberCorrect = true;
    } catch(e) {
      if (e.status === 404) {
        numberCorrect = false;
      }
    }
    return { result: numberCorrect }
  }
}
