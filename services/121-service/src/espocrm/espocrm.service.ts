import { Injectable } from '@nestjs/common';
import { UpdateRegistrationDto } from '../registration/dto/update-registration.dto';
import { RegistrationsService } from '../registration/registrations.service';

@Injectable()
export class EspocrmService {
  public constructor(
    private readonly registrationsService: RegistrationsService,
  ) {}

  public async updateRegistration(
    updateRegistrations: UpdateRegistrationDto[],
  ): Promise<void> {
    for (const updateRegistration of updateRegistrations) {
      const referenceId = updateRegistration.id;
      for (const key in updateRegistration) {
        if (key !== 'id') {
          const value = updateRegistration[key];
          try {
            await this.registrationsService.setAttribute(
              referenceId,
              key,
              value,
            );
          } catch (error) {
            if (error.name !== 'RegistrationDataSaveError') {
              console.warn('Unknown error: ', error);
              console.log(
                `Failed updating '${key}' with value: ${value} (referenceId: ${referenceId})`,
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
