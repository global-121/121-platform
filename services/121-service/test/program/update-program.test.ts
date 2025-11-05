import { HttpStatus } from '@nestjs/common';

import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Update program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should update a program', async () => {
    // Arrange
    // Test with a few possibly to be changed attributes, not all attributes of a program
    const program: UpdateProgramDto = {
      titlePortal: { en: 'new title' },
      description: { en: 'new description' },
      distributionDuration: 100,
      fixedTransferValue: 500,
      budget: 50000,
      monitoringDashboardUrl: 'https://example.org/new-dashboard',
      fullnameNamingConvention: ['firstName', 'lastName'],
      tryWhatsAppFirst: true,
      languages: [UILanguage.en, UILanguage.nl],
    };

    // Act
    // Call the update function
    const updateProgramResponse = await patchProgram(2, program, accessToken);

    // Assert
    // Check the response to see if the attributes were actually updated
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(updateProgramResponse.body.titlePortal).toStrictEqual({
      en: program.titlePortal!.en!,
      nl: 'NLRC Programma Voedsel',
    });
    expect(updateProgramResponse.body.description).toStrictEqual({
      en: program.description!.en!,
      nl: 'Een beschrijving.',
    });
    expect(updateProgramResponse.body.distributionDuration).toBe(
      program.distributionDuration,
    );
    expect(updateProgramResponse.body.fixedTransferValue).toBe(
      program.fixedTransferValue,
    );
    expect(updateProgramResponse.body.budget).toBe(program.budget);
    expect(updateProgramResponse.body.monitoringDashboardUrl).toBe(
      program.monitoringDashboardUrl,
    );
    expect(updateProgramResponse.body.fullnameNamingConvention).toStrictEqual(
      program.fullnameNamingConvention,
    );
    expect(updateProgramResponse.body.tryWhatsAppFirst).toBe(
      program.tryWhatsAppFirst,
    );
  });
});
