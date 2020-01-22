import { Injectable } from '@nestjs/common';

@Injectable()
export class LookupService {
  public constructor() {}

  public async lookupPhoneNr(
    phoneNumber: string,
  ): Promise<void> {
    console.log('lookup', phoneNumber)
  }
}
