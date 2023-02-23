import { Injectable } from '@nestjs/common';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';

@Injectable()
export class EspocrmService {

  public async patchRegistration(patchRegistrations: PatchRegistrationDto[]): Promise<void> {
    console.log('patchRegistrations: ', patchRegistrations);
    return;
  }

  public async deleteRegistration(): Promise<void> {
    return;
  }
}
