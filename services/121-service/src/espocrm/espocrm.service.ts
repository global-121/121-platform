import { Injectable } from '@nestjs/common';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';
import { RegistrationsService } from '../registration/registrations.service';

@Injectable()
export class EspocrmService {
  public constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async patchRegistration(
    patchRegistrations: PatchRegistrationDto[],
  ): Promise<void> {
    for (const patchRegistration of patchRegistrations) {
      const refId = patchRegistration.id;
      for (const key in patchRegistration) {
        if (key !== 'id') {
          const value = patchRegistration[key];
          try {
            await this.registrationsService.setAttribute(refId, key, value);
          } catch (error) {
            if (error.name !== 'RegistrationDataSaveError') {
              console.warn('Unknown error: ', error);
              console.log(
                `Failed updating '${key}' with value: ${value} (referenceId: ${refId})`,
              );
            }
          }
        }
      }
    }
    return;
  }

  public async deleteRegistration(): Promise<void> {
    return;
  }
}
