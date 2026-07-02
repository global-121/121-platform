import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import {
  getKoboFromProgram,
  setupProgramWithKoboIntegration,
} from '@121-service/test/helpers/kobo.helper';
import {
  duplicateProgram,
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Duplicate program', () => {
  const copyFromProgramId = 2;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should copy a program and persist it', async () => {
    // Arrange
    const sourceProgramResponse = await getProgram(
      copyFromProgramId,
      accessToken,
    );
    const sourceProgram = sourceProgramResponse.body;

    // Act
    const duplicateResponse = await duplicateProgram(
      copyFromProgramId,
      accessToken,
    );

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);

    const newProgramId = duplicateResponse.body.id;
    expect(newProgramId).toBeDefined();
    expect(newProgramId).not.toBe(copyFromProgramId);

    // The copy should be retrievable, proving it was persisted.
    const persistedProgramResponse = await getProgram(
      newProgramId,
      accessToken,
    );
    expect(persistedProgramResponse.statusCode).toBe(HttpStatus.OK);
    expect(persistedProgramResponse.body.id).toBe(newProgramId);
    expect(persistedProgramResponse.body.titlePortal).toStrictEqual(
      sourceProgram.titlePortal,
    );
    expect(persistedProgramResponse.body.currency).toBe(sourceProgram.currency);
  });

  it('should not copy start and end date when disabled in propertiesToDuplicate', async () => {
    // Arrange
    const createProgramResponse = await postProgram(
      {
        titlePortal: { en: 'Source program for non-duplicated fields' },
        currency: CurrencyCode.EUR,
        location: 'Utrecht',
        startDate: new Date('2026-04-01T00:00:00.000Z'),
        endDate: new Date('2026-08-01T00:00:00.000Z'),
      },
      accessToken,
    );
    const sourceProgramId = createProgramResponse.body.id;

    const sourceProgramResponse = await getProgram(sourceProgramId, accessToken);
    expect(sourceProgramResponse.body.startDate).toBeTruthy();
    expect(sourceProgramResponse.body.endDate).toBeTruthy();

    // Act
    const duplicateResponse = await duplicateProgram(sourceProgramId, accessToken);

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);
    const duplicatedProgramId = duplicateResponse.body.id;
    const duplicatedProgramResponse = await getProgram(
      duplicatedProgramId,
      accessToken,
    );

    expect(duplicatedProgramResponse.body.location).toBe('Utrecht');
    expect(duplicatedProgramResponse.body.startDate).toBeNull();
    expect(duplicatedProgramResponse.body.endDate).toBeNull();
  });

  it('should duplicate the one-to-one Kobo relation', async () => {
    // Arrange
    await resetDB({ seedScript: SeedScript.productionInitialState });

    const sourceProgram = {
      titlePortal: { en: 'Source program with Kobo integration' },
      currency: CurrencyCode.EUR,
      enableMaxPayments: true,
      fixedTransferValue: 20,
      languages: [RegistrationPreferredLanguage.en],
      programRegistrationAttributes: [
        {
          name: FspAttributes.nationalId,
          label: { en: 'National ID' },
          type: RegistrationAttributeTypes.text,
          options: [],
        },
      ],
    };

    const fspConfiguration = {
      name: 'Safaricom',
      label: { en: 'Safaricom' },
      fspName: Fsps.safaricom,
      properties: [],
    };

    const { programId: sourceProgramId } = await setupProgramWithKoboIntegration(
      {
        assetUid: KoboMockAssetUids.happyFlow,
        program: sourceProgram,
        fspConfiguration,
        accessToken,
      },
    );

    const sourceKoboResponse = await getKoboFromProgram({
      programId: sourceProgramId,
      accessToken,
    });
    expect(sourceKoboResponse.status).toBe(HttpStatus.OK);

    // Act
    const duplicateResponse = await duplicateProgram(sourceProgramId, accessToken);

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);

    const duplicatedProgramId = duplicateResponse.body.id;
    const duplicatedKoboResponse = await getKoboFromProgram({
      programId: duplicatedProgramId,
      accessToken,
    });

    expect(duplicatedKoboResponse.status).toBe(HttpStatus.OK);
    expect(duplicatedKoboResponse.body.assetUid).toBe(
      sourceKoboResponse.body.assetUid,
    );
  });
});
