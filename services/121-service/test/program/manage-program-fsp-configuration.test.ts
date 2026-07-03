import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import {
  FspConfigurationPropertyVisibility,
  FspConfigurationPropertyVisibilityMap,
} from '@121-service/src/fsp-integrations/shared/consts/fsp-configuration-property-visibility.const';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { getFspConfigurationProperties } from '@121-service/src/fsp-management/fsp-settings.helpers';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { ProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  getProgram,
  getTransactionsByPaymentIdPaginated,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFspConfiguration,
  deleteProgramFspConfigurationProperty,
  getProgramFspConfigurationProperties,
  getProgramFspConfigurations,
  getPublicProgramFspConfigurationProperties,
  patchProgramFspConfiguration,
  patchProgramFspConfigurationProperty,
  patchProgramFspConfigurationsByFsps,
  postProgramFspConfiguration,
  postProgramFspConfigurationProperties,
  postProgramFspConfigurationsByFspNames,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
  deleteRegistrations,
  seedIncludedRegistrations,
  seedPaidRegistrations,
  waitForStatusChangeToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

// Only tests most of the happy paths, edge cases are mostly covered in the unit tests

const hiddenString = '[********]';

// A minimal program the tests build on.
const baseProgram: CreateProgramDto = {
  titlePortal: { en: 'FSP-configuration test program' },
  currency: CurrencyCode.EUR,
  languages: [RegistrationPreferredLanguage.en],
};

// Intersolve Voucher WhatsApp is the simplest FSP with hidden (secret) properties: just a username and password
const seededFspConfigVoucher = {
  fsp: Fsps.intersolveVoucherWhatsapp,
  properties: [
    { name: FspConfigurationProperties.username, value: 'mock-username' },
    { name: FspConfigurationProperties.password, value: 'mock-password' },
  ],
};

// Intersolve Visa is needed because it is the only FSP with both "visible" (default) and "public" configuration properties
const seededFspConfigVisa = {
  fsp: Fsps.intersolveVisa,
  properties: [
    { name: FspConfigurationProperties.brandCode, value: 'mock-brand-code' },
    {
      name: FspConfigurationProperties.coverLetterCode,
      value: 'mock-cover-letter-code',
    },
    {
      name: FspConfigurationProperties.fundingTokenCode,
      value: 'mock-funding-token-code',
    },
    { name: FspConfigurationProperties.cardDistributionByMail, value: true },
    { name: FspConfigurationProperties.maxBalanceInCents, value: 15000 },
  ],
};

// Commercial Bank of Ethiopia is a simple API FSP whose payments succeed in mock mode without any message templates, so the payment-related tests use it
const seededFspConfigCbe = {
  fsp: Fsps.commercialBankEthiopia,
  properties: [
    { name: FspConfigurationProperties.username, value: 'mock-username' },
    { name: FspConfigurationProperties.password, value: 'mock-password' },
  ],
};

const seededFspConfigs = [
  seededFspConfigVoucher,
  seededFspConfigVisa,
  seededFspConfigCbe,
];

// A minimal Commercial Bank of Ethiopia registration; each test spreads this with a unique referenceId because referenceIds are globally unique and the database is not reset between tests
const baseRegistrationCbe = {
  phoneNumber: '14155238886',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  programFspConfigurationName: Fsps.commercialBankEthiopia,
  fullName: 'Test CBE registration',
  bankAccountNumber: '407951684723597',
};

const createProgramFspConfigurationDtoIntersolveVoucher: CreateProgramFspConfigurationDto =
  {
    name: 'Intersolve Voucher WhatsApp name',
    label: {
      en: 'Intersolve Voucher WhatsApp label',
    },
    fspName: Fsps.intersolveVoucherWhatsapp,
    properties: [
      {
        name: FspConfigurationProperties.username,
        value: 'user123',
      },
      {
        name: FspConfigurationProperties.password,
        value: 'password123',
      },
    ],
  };

const createProgramFspConfigurationDtoSafaricom: CreateProgramFspConfigurationDto =
  {
    name: 'Safaricom name',
    label: {
      en: 'Safaricom label',
    },
    fspName: Fsps.safaricom,
    properties: [],
  };

// Posts a bare-bones program and creates the FSP-configurations the tests rely on, returning the new program's id
async function createProgramWithFspConfigurations({
  accessToken,
}: {
  accessToken: string;
}): Promise<number> {
  const createProgramResponse = await postProgram(baseProgram, accessToken);
  const programId = createProgramResponse.body.id;

  // Posting a program does not create its FSP-configurations, so create the ones the tests rely on
  for (const fspConfig of seededFspConfigs) {
    const response = await postProgramFspConfiguration({
      programId,
      body: {
        name: fspConfig.fsp,
        label: { en: fspConfig.fsp },
        fspName: fspConfig.fsp,
        properties: fspConfig.properties,
      },
      accessToken,
    });
    // Fail fast so a misconfigured setup does not surface as confusing errors in individual tests
    if (response.statusCode !== HttpStatus.CREATED) {
      throw new Error(
        `Failed to create FSP-configuration ${fspConfig.fsp}: ${response.text}`,
      );
    }
  }

  return programId;
}

describe('Manage FSP-configurations', () => {
  let accessToken: string;
  let programId: number;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();
  });

  it('should add program FSP-configuration to an existing program', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    // Act
    const result = await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationDtoIntersolveVoucher,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) =>
        config.name === createProgramFspConfigurationDtoIntersolveVoucher.name,
    );
    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    expect(result.body).toEqual(
      expect.objectContaining({
        name: createProgramFspConfigurationDtoIntersolveVoucher.name,
        label: createProgramFspConfigurationDtoIntersolveVoucher.label,
        fspName: createProgramFspConfigurationDtoIntersolveVoucher.fspName,
      }),
    );
    const propertyNamesResult = result.body.properties
      .map((property) => property.name)
      .sort();
    const propertyNamesExpected =
      createProgramFspConfigurationDtoIntersolveVoucher
        .properties!.map((property) => property.name)
        .sort();
    expect(propertyNamesResult).toEqual(
      expect.arrayContaining(propertyNamesExpected),
    );
    // All properties should have updated field as timestamp
    result.body.properties.forEach((property) => {
      const date = new Date(property.updated);
      expect(!isNaN(date.getTime())).toBeTruthy();
      expect(property.value).toBe(hiddenString); // All values from intersolve voucher are hidden
    });
    // Ensure that the update data is reflected in the get response so actually updated in the db
    expect(getResultConfig).toBeDefined();
    expect(
      getResultConfig!.properties.map((property) => property.name).sort(),
    ).toEqual(result.body.properties.map((property) => property.name).sort());
    expect({ ...getResultConfig!, properties: undefined }).toEqual({
      ...result.body,
      properties: undefined,
    });
  });

  it('should create multiple program FSP-configurations from fsp names', async () => {
    // Arrange
    const fspNamesToCreate = [Fsps.airtel, Fsps.nedbank];

    // Act
    const result = await postProgramFspConfigurationsByFspNames({
      programId: programIdVisa,
      fspNames: fspNamesToCreate,
      accessToken,
    });

    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    expect(getResult.body.map((configuration) => configuration.fspName)).toEqual(
      expect.arrayContaining(fspNamesToCreate),
    );
  });

  it('should add an FSP to existing FSPs', async () => {
    const beforeResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });

    // Act
    const result = await patchProgramFspConfigurationsByFsps({
      programId: programIdVisa,
      fsps: [Fsps.intersolveVisa, Fsps.airtel],
      accessToken,
    });

    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.OK);
    const beforeFspNames = beforeResult.body
      .map((configuration) => configuration.fspName)
      .sort();
    const afterFspNames = getResult.body
      .map((configuration) => configuration.fspName)
      .sort();

    expect(beforeFspNames).toEqual(
      [Fsps.intersolveVisa, Fsps.intersolveVoucherWhatsapp].sort(),
    );
    expect(afterFspNames).toEqual([Fsps.intersolveVisa, Fsps.airtel].sort());
  });

  it('should remove an FSP from existing FSPs', async () => {
    // Arrange
    await postProgramFspConfiguration({
      programId: programIdVisa,
      body: {
        name: Fsps.airtel,
        label: { en: 'Airtel' },
        fspName: Fsps.airtel,
        properties: [],
      },
      accessToken,
    });

    const beforeResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });

    // Act
    const result = await patchProgramFspConfigurationsByFsps({
      programId: programIdVisa,
      fsps: [Fsps.intersolveVisa],
      accessToken,
    });

    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.OK);
    const beforeFspNames = beforeResult.body
      .map((configuration) => configuration.fspName)
      .sort();
    const afterFspNames = getResult.body
      .map((configuration) => configuration.fspName)
      .sort();

    expect(beforeFspNames).toEqual(
      [Fsps.intersolveVisa, Fsps.intersolveVoucherWhatsapp, Fsps.airtel].sort(),
    );
    expect(afterFspNames).toEqual([Fsps.intersolveVisa].sort());
  });

  it('should save a program FSP-configuration without properties with state "configurationPending"', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    const createProgramFspConfigurationDtoIncomplete: CreateProgramFspConfigurationDto =
      {
        name: 'Intersolve Visa incomplete config',
        label: {
          en: 'Intersolve Visa incomplete config label',
        },
        fspName: Fsps.intersolveVisa,
      };

    // Act
    const result = await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationDtoIncomplete,
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    expect(result.body.state).toBe(FspConfigurationStates.configurationPending);
  });

  it('should set program FSP-configuration state to "configured" after updating with all required properties', async () => {
    // Arrange - create a config that is missing a required property
    programId = await createProgramWithFspConfigurations({ accessToken });
    const createProgramFspConfigurationDtoIncomplete: CreateProgramFspConfigurationDto =
      {
        name: 'Intersolve Voucher incomplete config',
        label: {
          en: 'Intersolve Voucher incomplete config label',
        },
        fspName: Fsps.intersolveVoucherWhatsapp,
        properties: [
          {
            name: FspConfigurationProperties.username,
            value: 'user123',
          },
        ],
      };
    const createResult = await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationDtoIncomplete,
      accessToken,
    });

    // Act - update the config with all required properties
    const updateProgramFspConfigurationDto: UpdateProgramFspConfigurationDto = {
      label: createProgramFspConfigurationDtoIncomplete.label,
      properties: [
        {
          name: FspConfigurationProperties.username,
          value: 'user123',
        },
        {
          name: FspConfigurationProperties.password,
          value: 'password123',
        },
      ],
    };
    const updateResult = await patchProgramFspConfiguration({
      programId,
      name: createProgramFspConfigurationDtoIncomplete.name,
      body: updateProgramFspConfigurationDto,
      accessToken,
    });

    // Assert
    expect(createResult.body.state).toBe(
      FspConfigurationStates.configurationPending,
    );
    expect(updateResult.statusCode).toBe(HttpStatus.OK);
    expect(updateResult.body.state).toBe(FspConfigurationStates.configured);
  });

  it('should set program FSP-configuration state to "configurationPending" after removing a required property', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    // Act - remove a required property from a fully configured config
    await deleteProgramFspConfigurationProperty({
      programId,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      accessToken,
    });

    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const config = getResult.body.find(
      (config) => config.name === seededFspConfigVoucher.fsp,
    );

    // Assert
    expect(config?.state).toBe(FspConfigurationStates.configurationPending);
  });

  it('should add missing required program registration attributes when adding a program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    const program = await getProgram(programId, accessToken);
    const programRegistrationAttributes =
      program.body.programRegistrationAttributes;

    // Storing the original phone number attribute to check later that it's not being overridden, since it's also required by safaricom configuration and already exists in the program before adding the configuration, so should not be added again or overridden
    const originalPhoneNumberProgramRegistrationAttribute =
      programRegistrationAttributes.find(
        (attr: ProgramRegistrationAttributeDto) =>
          attr.name === FspAttributes.phoneNumber,
      );

    // Act
    const result = await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationDtoSafaricom,
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);

    const updatedProgram = await getProgram(programId, accessToken);
    const updatedProgramRegistrationAttributes: ProgramRegistrationAttributeDto[] =
      updatedProgram.body.programRegistrationAttributes;

    // The posted program does not include nationalId, but it is a required attribute of the Safaricom FSP
    expect(
      updatedProgramRegistrationAttributes.map(
        (attr: ProgramRegistrationAttributeDto) => attr.name,
      ),
    ).toContain(FspAttributes.nationalId);

    expect(
      updatedProgramRegistrationAttributes.find(
        (attribute: ProgramRegistrationAttributeDto) =>
          attribute.name === FspAttributes.phoneNumber,
      ),
    ).toEqual(originalPhoneNumberProgramRegistrationAttribute);
  });

  it('should patch existing program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    // Act
    const updateProgramFspConfigurationDto: UpdateProgramFspConfigurationDto = {
      label: {
        en: 'Intersolve Voucher WhatsApp label updated',
        nl: 'Intersolve Voucher WhatsApp label Dutch translation updated',
        es: 'Intersolve Voucher WhatsApp label Spanish translation updated',
      },
      properties: [
        {
          name: FspConfigurationProperties.username,
          value: 'user1234',
        },
      ],
    };
    const name = seededFspConfigVoucher.fsp;
    const result = await patchProgramFspConfiguration({
      programId,
      name,
      body: updateProgramFspConfigurationDto,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );

    // Assert
    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.body).toEqual(
      expect.objectContaining({
        name,
        label: updateProgramFspConfigurationDto.label,
        fspName: seededFspConfigVoucher.fsp,
      }),
    );
    const propertyNamesResult = result.body.properties.map(
      (property) => property.name,
    );
    const propertyNamesExpected =
      updateProgramFspConfigurationDto.properties!.map(
        (property) => property.name,
      );
    expect(propertyNamesResult).toEqual(
      expect.arrayContaining(propertyNamesExpected),
    );
    // All properties should have updated field as timestamp
    result.body.properties.forEach((property) => {
      const date = new Date(property.updated);
      expect(!isNaN(date.getTime())).toBeTruthy();
      expect(property.value).toBe(hiddenString); // All values from intersolve voucher are hidden
    });
    // Ensure that the update data is reflected in the get response so actually updated in the db
    expect(getResultConfig).toEqual(result.body);
  });

  it('should delete existing program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProgramFspConfiguration({
      programId,
      name,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );
    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).toBeUndefined();
  });

  it('should not delete existing program FSP-configuration because of active registrations with that config', async () => {
    // Arrange: the config cannot be deleted as long as non-deleted registrations use it, so an included registration is enough (no payment needed)
    programId = await createProgramWithFspConfigurations({ accessToken });
    await seedIncludedRegistrations(
      [{ ...baseRegistrationCbe, referenceId: 'cbe-active-registrations' }],
      programId,
      accessToken,
    );

    // Act
    const name = seededFspConfigCbe.fsp;
    const result = await deleteProgramFspConfiguration({
      programId,
      name,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CONFLICT);
    expect(result.body).toMatchSnapshot();
    expect(getResultConfig).toBeDefined();
  });

  it('should add program FSP-configuration properties to an existing program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    const createProgramFspConfigurationDtoNoProperties = {
      ...createProgramFspConfigurationDtoIntersolveVoucher,
      properties: undefined,
    };
    await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationDtoNoProperties,
      accessToken,
    });

    // Act
    const result = await postProgramFspConfigurationProperties({
      programId,
      properties: createProgramFspConfigurationDtoIntersolveVoucher.properties!,
      accessToken,
      name: createProgramFspConfigurationDtoIntersolveVoucher.name,
    });

    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) =>
        config.name === createProgramFspConfigurationDtoIntersolveVoucher.name,
    );

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    const propertyNamesResult = result.body.map((property) => property.name);
    const propertyNamesExpected =
      createProgramFspConfigurationDtoIntersolveVoucher.properties!.map(
        (property) => property.name,
      );
    expect(propertyNamesResult).toEqual(
      expect.arrayContaining(propertyNamesExpected),
    );
    // All properties should have updated field as timestamp
    result.body.forEach((property) => {
      const date = new Date(property.updated);
      expect(!isNaN(date.getTime())).toBeTruthy();
    });
    // Ensure that the update data is reflected in the get response so actually updated in the db
    expect(getResultConfig?.properties).toEqual(result.body);
  });

  it('should patch a property of an existing program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    const updatedPropertyDto: UpdateProgramFspConfigurationPropertyDto = {
      value: 'user1234',
    };
    const getResultBefore = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const usernamePropertyBefore = getResultBefore.body
      .find((config) => config.name === seededFspConfigVoucher.fsp)!
      .properties.find(
        (property) => property.name === FspConfigurationProperties.username,
      );

    // Act
    const patchResult = await patchProgramFspConfigurationProperty({
      programId,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      body: updatedPropertyDto,
      accessToken,
    });

    const getResultAfter = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const usernamePropertyAfter = getResultAfter.body
      .find((config) => config.name === seededFspConfigVoucher.fsp)!
      .properties.find(
        (property) => property.name === FspConfigurationProperties.username,
      );

    // Assert
    expect(patchResult.statusCode).toBe(HttpStatus.OK);

    // Ensure that the username property value has been updated checking if the updated timestamp is later, since the value is not returned in the response
    expect(usernamePropertyAfter?.updated).not.toEqual(
      usernamePropertyBefore?.updated,
    );
    expect(new Date(usernamePropertyAfter!.updated).getTime()).toBeGreaterThan(
      new Date(usernamePropertyBefore!.updated).getTime(),
    );
  });

  it('should delete a property of an existing program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    // Act
    const deleteResult = await deleteProgramFspConfigurationProperty({
      programId,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      accessToken,
    });

    const getResultAfter = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const config = getResultAfter.body.find(
      (config) => config.name === seededFspConfigVoucher.fsp,
    );

    const usernamePropertyAfter = config?.properties.find(
      (property) => property.name === FspConfigurationProperties.username,
    );

    // Assert
    expect(deleteResult.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(usernamePropertyAfter).toBeUndefined();
    expect(config?.properties.length).toBe(
      seededFspConfigVoucher.properties.length - 1,
    );
  });

  it('Should return all visible properties of a program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    const enumValues = Object.values(FspConfigurationProperties);
    // Act
    const getVisibleProperties = await getProgramFspConfigurationProperties({
      programId,
      configName: Fsps.intersolveVisa, //This configuration has visible properties
      accessToken,
    });
    // Assert
    expect(getVisibleProperties.statusCode).toBe(HttpStatus.OK);
    const properties = getVisibleProperties.body;
    properties.forEach((property) => {
      expect(property.value).not.toBe(hiddenString); // Visible properties should not be masked
    });
    properties.forEach((property) => {
      expect(property.name).not.toBe(FspConfigurationProperties.username);
      expect(property.name).not.toBe(FspConfigurationProperties.password);
    });
    properties.forEach((property) => {
      expect(enumValues).toContain(property.name);
    });
  });

  it('Returns masked values for hidden properties of a program FSP-configuration', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    // Act
    const getHiddenProperties = await getProgramFspConfigurationProperties({
      programId,
      configName: Fsps.intersolveVoucherWhatsapp, // This configuration has hidden properties
      accessToken,
    });
    // Assert
    expect(getHiddenProperties.statusCode).toBe(HttpStatus.OK);
    const properties = getHiddenProperties.body;
    const hiddenPropertyNames = properties.map((property) => property.name);
    // Checks that only hidden properties are returned
    expect(hiddenPropertyNames).toEqual(
      expect.arrayContaining([
        FspConfigurationProperties.username,
        FspConfigurationProperties.password,
      ]),
    );
    properties.forEach((property) => {
      expect(property.value).toBe(hiddenString); // Hidden properties should be masked
    });
  });

  it('Should return allowlisted public properties of a program FSP-configuration for users with program.read permission', async () => {
    // Arrange
    programId = await createProgramWithFspConfigurations({ accessToken });
    const programReadAccessToken = await createAccessTokenWithPermissions({
      permissions: [PermissionEnum.ProgramREAD],
      adminAccessToken: accessToken,
      programId,
    });

    // Act
    const result = await getPublicProgramFspConfigurationProperties({
      programId,
      configName: Fsps.intersolveVisa,
      accessToken: programReadAccessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.body).toHaveLength(1);

    const returnedPropertyNames = result.body.map((p) => p.name);
    const allowlistedPropertyNames = getFspConfigurationProperties(
      Fsps.intersolveVisa,
    ).filter(
      (propertyName) =>
        FspConfigurationPropertyVisibilityMap[propertyName] ===
        FspConfigurationPropertyVisibility.public,
    );

    expect(returnedPropertyNames.sort()).toEqual(
      allowlistedPropertyNames?.sort(),
    );
  });
});

// This test is isolated in its own describe block because it needs a full DB reset to the cbeProgram seed
// (the admin must be approved to run a payment, which is not possible on a posted bare-bones program)
describe('Manage FSP-configurations - deleting config with existing transactions', () => {
  let accessToken: string;
  let programId: number;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.cbeProgram });
    accessToken = await getAccessToken();
    programId = 1;
  });

  // Checking this exception in api test because it's hard to unit test the more complex transaction querybuilder part
  it('should set programFspConfigurationId of transactions to null', async () => {
    // Arrange
    // TODO: In the future use the new duplicate program endpoint to create a program with an admin as approved instead of resetting the DB
    const registrationCbe = {
      ...baseRegistrationCbe,
      referenceId: 'cbe-existing-transactions',
    };
    const paymentId = await seedPaidRegistrations({
      registrations: [registrationCbe],
      programId,
    });

    await awaitChangeRegistrationStatus({
      programId,
      referenceIds: [registrationCbe.referenceId],
      status: RegistrationStatusEnum.declined,
      accessToken,
    });
    await deleteRegistrations({
      programId,
      referenceIds: [registrationCbe.referenceId],
      accessToken,
    });
    await waitForStatusChangeToComplete({
      programId,
      amountOfRegistrations: 1,
      status: RegistrationStatusEnum.deleted,
      maxWaitTimeMs: 8_000,
      accessToken,
    });

    // Act
    const name = seededFspConfigCbe.fsp;
    const result = await deleteProgramFspConfiguration({
      programId,
      name,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );

    const getTransactions = await getTransactionsByPaymentIdPaginated({
      programId,
      paymentId,
      registrationReferenceId: registrationCbe.referenceId,
      accessToken,
    });
    const transactions = getTransactions.body.data;

    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).not.toBeDefined();
    expect(transactions[0].programFspConfigurationName).toBe(null);
  });
});
