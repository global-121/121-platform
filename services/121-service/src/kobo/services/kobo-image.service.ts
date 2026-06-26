import { Injectable } from '@nestjs/common';

import { ProgramRegistrationAttributesService } from '@121-service/src/program-registration-attributes/program-registration-attributes.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationsService } from '@121-service/src/registration/services/registrations.service';

@Injectable()
export class KoboImageService {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly programRegistrationAttributesService: ProgramRegistrationAttributesService,
  ) {}

  /**
   * Resolves the Kobo image URLs stored for every 'koboImage'-type registration
   * attribute of a registration. Attributes without a stored value are omitted.
   */
  public async getKoboImageUrls({
    programId,
    referenceId,
  }: {
    programId: number;
    referenceId: string;
  }): Promise<{ attributeName: string; url: string }[]> {
    const koboImageAttributeNames =
      await this.getProgramKoboImageAttributeNames({ programId });

    const registration = await this.registrationsService.getRegistrationOrThrow(
      {
        referenceId,
        programId,
      },
    );

    const urlsByAttributeName =
      await this.registrationDataService.getRegistrationDataValuesByNames(
        registration,
        koboImageAttributeNames,
      );

    const images: { attributeName: string; url: string }[] = [];
    for (const attributeName of koboImageAttributeNames) {
      const url = urlsByAttributeName.get(attributeName);
      if (url) {
        images.push({ attributeName, url });
      }
    }

    return images;
  }

  private async getProgramKoboImageAttributeNames({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    const attributes =
      await this.programRegistrationAttributesService.getAttributes({
        programId,
        includeProgramRegistrationAttributes: true,
        includeTemplateDefaultAttributes: false,
      });

    return attributes
      .filter((attr) => attr.type === RegistrationAttributeTypes.koboImage)
      .map((attr) => attr.name);
  }
}
