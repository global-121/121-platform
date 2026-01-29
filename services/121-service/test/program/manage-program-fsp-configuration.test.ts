import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  PublicFspConfigurationProperties,
} from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { UpdateProgramFspConfigurationPropertyDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration-property.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { paymentIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { getTransactionsByPaymentIdPaginated } from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFspConfiguration,
  deleteProgramFspConfigurationProperty,
  getProgramFspConfigurationProperties,
  getProgramFspConfigurations,
  getPublicProgramFspConfigurationProperties,
  patchProgramFspConfiguration,
  patchProgramFspConfigurationProperty,
  postProgramFspConfiguration,
  postProgramFspConfigurationProperties,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
  deleteRegistrations,
  seedPaidRegistrations,
  waitForStatusChangeToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationOCW5 } from '@121-service/test/registrations/pagination/pagination-data';

// Only tests most of the happy paths, edge cases are mostly covered in the unit tests

const hiddenString = '[********]';

const seededFspConfigVoucher = programOCW.programFspConfigurations.find(
  (fspConfig) => fspConfig.fsp === Fsps.intersolveVoucherWhatsapp,
)!;

const createProgramFspConfigurationDto: CreateProgramFspConfigurationDto = {
  name: 'Intersolve Voucher WhatsApp name',
  label: {
    en: 'Intersolve Voucher WhatsApp label',
    nl: 'Intersolve Voucher WhatsApp label Dutch translation',
    es: 'Intersolve Voucher WhatsApp label Spanish translation',
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

describe('Manage Fsp configurations', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should add program Fsp configuration to an existing program', async () => {
    // Act
    const result = await postProgramFspConfiguration({
      programId: programIdVisa,
      body: createProgramFspConfigurationDto,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === createProgramFspConfigurationDto.name,
    );
    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    expect(result.body).toEqual(
      expect.objectContaining({
        name: createProgramFspConfigurationDto.name,
        label: createProgramFspConfigurationDto.label,
        fspName: createProgramFspConfigurationDto.fspName,
      }),
    );
    const propertyNamesResult = result.body.properties
      .map((property) => property.name)
      .sort();
    const propertyNamesExpected = createProgramFspConfigurationDto
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
    expect(getResultConfig).toEqual(result.body);
  });

  it('should patch existing program Fsp configuration', async () => {
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
      programId: programIdVisa,
      name,
      body: updateProgramFspConfigurationDto,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
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

  it('should delete existing program Fsp configuration', async () => {
    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProgramFspConfiguration({
      programId: programIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );
    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).toBeUndefined();
  });

  it('should not delete existing program Fsp configuration because of active registrations with that config', async () => {
    // Prepare
    await seedPaidRegistrations({
      registrations: [registrationOCW5],
      programId: programIdVisa,
    });

    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProgramFspConfiguration({
      programId: programIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
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

  // Checking this exception in api test because it's hard to unit test the more complex transaction querybuilder part
  it('deleting program Fsp configuration with existing transactions should set programFspConfigurationId of transactions to null', async () => {
    // Prepare
    await seedPaidRegistrations({
      registrations: [registrationOCW5],
      programId: programIdVisa,
    });

    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationOCW5.referenceId],
      status: RegistrationStatusEnum.declined,
      accessToken,
    });
    await deleteRegistrations({
      programId: programIdVisa,
      referenceIds: [registrationOCW5.referenceId],
      accessToken,
    });
    await waitForStatusChangeToComplete({
      programId: programIdVisa,
      amountOfRegistrations: 1,
      status: RegistrationStatusEnum.deleted,
      maxWaitTimeMs: 8_000,
      accessToken,
    });

    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProgramFspConfiguration({
      programId: programIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );

    const getTranactions = await getTransactionsByPaymentIdPaginated({
      programId: programIdVisa,
      paymentId: paymentIdVisa,
      registrationReferenceId: registrationOCW5.referenceId,
      accessToken,
    });
    const transactions = getTranactions.body.data;

    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).not.toBeDefined();
    expect(transactions[0].programFspConfigurationName).toBe(null);
  });

  it('should add program Fsp configuration properties to an existing program Fsp configuration', async () => {
    // Prepare
    const createProgramFspConfigurationDtoNoProperties = {
      ...createProgramFspConfigurationDto,
      properties: undefined,
    };
    await postProgramFspConfiguration({
      programId: programIdVisa,
      body: createProgramFspConfigurationDtoNoProperties,
      accessToken,
    });

    // Act
    const result = await postProgramFspConfigurationProperties({
      programId: programIdVisa,
      properties: createProgramFspConfigurationDto.properties!,
      accessToken,
      name: createProgramFspConfigurationDto.name,
    });

    const getResult = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === createProgramFspConfigurationDto.name,
    );

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    const propertyNamesResult = result.body.map((property) => property.name);
    const propertyNamesExpected =
      createProgramFspConfigurationDto.properties!.map(
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
    expect(getResultConfig?.properties.sort()).toEqual(result.body.sort());
  });

  it('should patch a property of an existing program Fsp configuration', async () => {
    // Prepare
    const updatedPropertyDto: UpdateProgramFspConfigurationPropertyDto = {
      value: 'user1234',
    };

    // Act
    const getResultBefore = await getProgramFspConfigurations({
      programId: programIdVisa,
      accessToken,
    });
    const usernamePropertyBefore = getResultBefore.body
      .find((config) => config.name === seededFspConfigVoucher.fsp)!
      .properties.find(
        (property) => property.name === FspConfigurationProperties.username,
      );

    const patchResult = await patchProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      body: updatedPropertyDto,
      accessToken,
    });

    const getResultAfter = await getProgramFspConfigurations({
      programId: programIdVisa,
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

  it('should delete a property of an existing program Fsp configuration', async () => {
    // Act
    const deleteResult = await deleteProgramFspConfigurationProperty({
      programId: programIdVisa,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      accessToken,
    });

    const getResultAfter = await getProgramFspConfigurations({
      programId: programIdVisa,
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

  it('Should return all visible properties of a program Fsp configuration', async () => {
    // Arrange
    const enumValues = Object.values(FspConfigurationProperties);
    // Act
    const getVisibleProperties = await getProgramFspConfigurationProperties({
      programId: programIdVisa,
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

  it('Returns masked values for hidden properties of a program Fsp configuration', async () => {
    // Act
    const getHiddenProperties = await getProgramFspConfigurationProperties({
      programId: programIdVisa,
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

  it('Should return allowlisted public properties of a program Fsp configuration for users with program.read permission', async () => {
    // Arrange
    const programReadAccessToken = await createAccessTokenWithPermissions({
      permissions: [PermissionEnum.ProgramREAD],
      adminAccessToken: accessToken,
      programId: programIdVisa,
    });

    // Act
    const result = await getPublicProgramFspConfigurationProperties({
      programId: programIdVisa,
      configName: Fsps.intersolveVisa,
      accessToken: programReadAccessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(result.body).toHaveLength(1);

    const returnedPropertyNames = result.body.map((p) => p.name);
    const allowlistedPropertyNames =
      PublicFspConfigurationProperties[Fsps.intersolveVisa];

    expect(returnedPropertyNames.sort()).toEqual(
      allowlistedPropertyNames?.sort(),
    );
  });
});
