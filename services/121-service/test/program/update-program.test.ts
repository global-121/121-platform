import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { UpdateProgramDto } from '@121-service/src/programs/dto/update-program.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Update program', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
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
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    };

    // Act
    // Call the update function
    const updateProgramResponse = await patchProgram(2, program, accessToken);

    // Assert
    // Check the response to see if the attributes were actually updated
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(updateProgramResponse.body.titlePortal).toStrictEqual(
      program.titlePortal,
    );
    expect(updateProgramResponse.body.description).toStrictEqual(
      program.description,
    );
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
    expect(updateProgramResponse.body.languages).toStrictEqual(
      program.languages,
    );
  });

  it('should add fsps to a program when updating it', async () => {
    // Arrange
    // Program 2 is seeded with Intersolve-voucher-whatsapp and Intersolve-visa
    const program: UpdateProgramDto = {
      fsps: [Fsps.intersolveVoucherWhatsapp, Fsps.intersolveVisa, Fsps.excel],
    };

    // Act
    const updateProgramResponse = await patchProgram(2, program, accessToken);

    // Assert
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(updateProgramResponse.body.fspConfigurations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fspName: Fsps.intersolveVoucherWhatsapp }),
        expect.objectContaining({ fspName: Fsps.intersolveVisa }),
        expect.objectContaining({ fspName: Fsps.excel }),
      ]),
    );
    expect(updateProgramResponse.body.fspConfigurations).toHaveLength(3);
  });

  it('should delete a fsp from a program when updating it', async () => {
    // Arrange
    // Program 2 is seeded with Intersolve-voucher-whatsapp and Intersolve-visa
    const program: UpdateProgramDto = {
      fsps: [Fsps.intersolveVisa],
    };

    // Act
    const updateProgramResponse = await patchProgram(2, program, accessToken);

    // Assert
    expect(updateProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(updateProgramResponse.body.fspConfigurations).toEqual([
      expect.objectContaining({ fspName: Fsps.intersolveVisa }),
    ]);
  });
});
