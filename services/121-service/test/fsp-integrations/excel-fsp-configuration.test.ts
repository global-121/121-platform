import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { postProgram } from '@121-service/test/helpers/program.helper';
import {
    getExcelFspConfiguration,
    getProgramFspConfigurations,
    patchProgramFspConfiguration,
    postProgramFspConfiguration,
    putExcelFspConfiguration,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
    getAccessToken,
    resetDB,
} from '@121-service/test/helpers/utility.helper';

// Only the key integration paths are tested here; the branching logic inside ExcelFspConfigurationService is covered by its unit spec

const configurationName = 'Excel FSP test config';

// A minimal program with the registration attributes the tests use
const baseProgram: CreateProgramDto = {
  titlePortal: { en: 'Excel FSP-configuration test program' },
  currency: CurrencyCode.EUR,
  languages: [RegistrationPreferredLanguage.en],
  programRegistrationAttributes: [
    {
      name: 'fullName',
      type: RegistrationAttributeTypes.text,
      label: { en: 'Full name' },
    },
    {
      name: 'phoneNumber',
      type: RegistrationAttributeTypes.text,
      label: { en: 'Phone number' },
    },
  ],
};

const programAttributeNames = baseProgram.programRegistrationAttributes!.map(
  ({ name }) => name,
);

// Posts a bare-bones program and creates the Excel FSP-configuration the tests rely on, returning the new program's id
async function createProgramWithExcelFspConfiguration({
  accessToken,
}: {
  accessToken: string;
}): Promise<number> {
  const createProgramResponse = await postProgram(baseProgram, accessToken);
  const programId = createProgramResponse.body.id;

  // Posting a program does not create its FSP-configurations, so create the one the tests rely on
  const response = await postProgramFspConfiguration({
    programId,
    body: {
      name: configurationName,
      label: { en: configurationName },
      fspName: Fsps.excel,
    },
    accessToken,
  });
  // Fail fast so a misconfigured setup does not surface as confusing errors in individual tests
  if (response.statusCode !== HttpStatus.CREATED) {
    throw new Error(
      `Failed to create Excel FSP-configuration: ${response.text}`,
    );
  }

  return programId;
}

describe('Excel FSP configuration', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();
  });

  it('should stay configurationPending until the Excel details are saved, then become configured', async () => {
    // Arrange
    const programId = await createProgramWithExcelFspConfiguration({
      accessToken,
    });

    // Act
    const detailsBeforeSave = await getExcelFspConfiguration({
      programId,
      configName: configurationName,
      accessToken,
    });
    const stateBeforeSave = (
      await getProgramFspConfigurations({ programId, accessToken })
    ).body.find((configuration) => configuration.name === configurationName)
      ?.state;
    const saved = await putExcelFspConfiguration({
      programId,
      configName: configurationName,
      body: { uniqueIdentifierField: 'phoneNumber' },
      accessToken,
    });
    const stateAfterSave = (
      await getProgramFspConfigurations({ programId, accessToken })
    ).body.find((configuration) => configuration.name === configurationName)
      ?.state;

    // Assert
    expect(detailsBeforeSave.statusCode).toBe(HttpStatus.OK);
    expect(detailsBeforeSave.body).toEqual({
      name: configurationName,
      label: { en: configurationName },
      uniqueIdentifierField: '',
      exportFields: [],
    });
    expect(stateBeforeSave).toBe(FspConfigurationStates.configurationPending);
    expect(saved.statusCode).toBe(HttpStatus.OK);
    expect(saved.body).toEqual({
      name: configurationName,
      label: { en: configurationName },
      uniqueIdentifierField: 'phoneNumber',
      exportFields: programAttributeNames,
    });
    expect(stateAfterSave).toBe(FspConfigurationStates.configured);
  });

  it('should keep the Excel configuration configured after a generic label update', async () => {
    // Arrange
    const programId = await createProgramWithExcelFspConfiguration({
      accessToken,
    });
    await putExcelFspConfiguration({
      programId,
      configName: configurationName,
      body: { uniqueIdentifierField: 'phoneNumber' },
      accessToken,
    });

    // Act
    const updated = await patchProgramFspConfiguration({
      programId,
      name: configurationName,
      body: { label: { en: 'Updated Excel FSP' } },
      accessToken,
    });

    // Assert
    expect(updated.statusCode).toBe(HttpStatus.OK);
    expect(updated.body.label).toEqual({ en: 'Updated Excel FSP' });
    expect(updated.body.state).toBe(FspConfigurationStates.configured);
  });

  it('should reject a non-array exportFields value', async () => {
    // Arrange
    const programId = await createProgramWithExcelFspConfiguration({
      accessToken,
    });

    // Act
    const response = await putExcelFspConfiguration({
      programId,
      configName: configurationName,
      body: {
        uniqueIdentifierField: 'phoneNumber',
        exportFields: 'fullName' as unknown as string[],
      },
      accessToken,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return 404 for an unknown configuration name', async () => {
    // Arrange
    const programId = await createProgramWithExcelFspConfiguration({
      accessToken,
    });

    // Act
    const response = await getExcelFspConfiguration({
      programId,
      configName: 'unknown-name',
      accessToken,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
