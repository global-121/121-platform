/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { UpdateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration.dto';
import { UpdateProgramFinancialServiceProviderConfigurationPropertyDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/update-program-financial-service-provider-configuration-property.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  paymentNrVisa,
  programIdVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import programOCW from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { getTransactions } from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFinancialServiceProviderConfiguration,
  deleteProgramFinancialServiceProviderConfigurationProperty,
  getProgramFinancialServiceProviderConfigurations,
  patchProgramFinancialServiceProviderConfiguration,
  patchProgramFinancialServiceProviderConfigurationProperty,
  postProgramFinancialServiceProviderConfiguration,
  postProgramFinancialServiceProviderConfigurationProperties,
} from '@121-service/test/helpers/program-financial-service-provider-configuration.helper';
import {
  awaitChangePaStatus,
  deleteRegistrations,
  seedPaidRegistrations,
  waitForStatusChangeToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationOCW5 } from '@121-service/test/registrations/pagination/pagination-data';

// Only tests most of the happy paths, edge cases are mostly covered in the unit tests

const seededFspConfigVoucher =
  programOCW.programFinancialServiceProviderConfigurations.find(
    (fspConfig) =>
      fspConfig.financialServiceProvider ===
      FinancialServiceProviders.intersolveVoucherWhatsapp,
  )!;

const createProgramFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto =
  {
    name: 'Intersolve Voucher WhatsApp name',
    label: {
      en: 'Intersolve Voucher WhatsApp label',
      nl: 'Intersolve Voucher WhatsApp label Dutch translation',
      es: 'Intersolve Voucher WhatsApp label Spanish translation',
    },
    financialServiceProviderName:
      FinancialServiceProviders.intersolveVoucherWhatsapp,
    properties: [
      {
        name: FinancialServiceProviderConfigurationProperties.username,
        value: 'user123',
      },
      {
        name: FinancialServiceProviderConfigurationProperties.password,
        value: 'password123',
      },
    ],
  };

describe('Manage financial service provider configurations', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should add program financial service provider configuration to an existing program', async () => {
    // Act
    const result = await postProgramFinancialServiceProviderConfiguration({
      programId: programIdVisa,
      body: createProgramFspConfigurationDto,
      accessToken,
    });
    const getResult = await getProgramFinancialServiceProviderConfigurations({
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
        financialServiceProviderName:
          createProgramFspConfigurationDto.financialServiceProviderName,
      }),
    );
    const propertyNamesResult = result.body.properties.map(
      (property) => property.name,
    );
    const propertyNamesExpected =
      createProgramFspConfigurationDto.properties!.map(
        (property) => property.name,
      );
    expect(propertyNamesResult).toEqual(
      expect.arrayContaining(propertyNamesExpected),
    );
    // All properties should have updated field as timestamp
    result.body.properties.forEach((property) => {
      const date = new Date(property.updated);
      expect(!isNaN(date.getTime())).toBeTruthy();
    });
    // Ensure that the update data is reflected in the get response so actually updated in the db
    expect(getResultConfig).toEqual(result.body);
  });

  it('should patch existing program financial service provider configuration', async () => {
    // Act
    const updateProgramFinancialServiceProviderConfigurationDto: UpdateProgramFinancialServiceProviderConfigurationDto =
      {
        label: {
          en: 'Intersolve Voucher WhatsApp label updated',
          nl: 'Intersolve Voucher WhatsApp label Dutch translation updated',
          es: 'Intersolve Voucher WhatsApp label Spanish translation updated',
        },
        properties: [
          {
            name: FinancialServiceProviderConfigurationProperties.username,
            value: 'user1234',
          },
        ],
      };
    const name = seededFspConfigVoucher.financialServiceProvider;
    const result = await patchProgramFinancialServiceProviderConfiguration({
      programId: programIdVisa,
      name,
      body: updateProgramFinancialServiceProviderConfigurationDto,
      accessToken,
    });
    const getResult = await getProgramFinancialServiceProviderConfigurations({
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
        label: updateProgramFinancialServiceProviderConfigurationDto.label,
        financialServiceProviderName:
          seededFspConfigVoucher.financialServiceProvider,
      }),
    );
    const propertyNamesResult = result.body.properties.map(
      (property) => property.name,
    );
    const propertyNamesExpected =
      updateProgramFinancialServiceProviderConfigurationDto.properties!.map(
        (property) => property.name,
      );
    expect(propertyNamesResult).toEqual(
      expect.arrayContaining(propertyNamesExpected),
    );
    // All properties should have updated field as timestamp
    result.body.properties.forEach((property) => {
      const date = new Date(property.updated);
      expect(!isNaN(date.getTime())).toBeTruthy();
    });
    // Ensure that the update data is reflected in the get response so actually updated in the db
    expect(getResultConfig).toEqual(result.body);
  });

  it('should delete existing program financial service provider configuration', async () => {
    // Act
    const name = seededFspConfigVoucher.financialServiceProvider;
    const result = await deleteProgramFinancialServiceProviderConfiguration({
      programId: programIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProgramFinancialServiceProviderConfigurations({
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

  it('should not delete existing program financial service provider configuration because of active registrations with that config', async () => {
    // Prepare
    await seedPaidRegistrations([registrationOCW5], programIdVisa);

    // Act
    const name = seededFspConfigVoucher.financialServiceProvider;
    const result = await deleteProgramFinancialServiceProviderConfiguration({
      programId: programIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProgramFinancialServiceProviderConfigurations({
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
  it('deleting program financial service provider configuration with existing transactions should set programFinancialServiceProviderConfigurationId of transactions to null', async () => {
    // Prepare
    await seedPaidRegistrations([registrationOCW5], programIdVisa);

    await awaitChangePaStatus(
      programIdVisa,
      [registrationOCW5.referenceId],
      RegistrationStatusEnum.declined,
      accessToken,
    );
    await deleteRegistrations(
      programIdVisa,
      [registrationOCW5.referenceId],
      accessToken,
    );
    await waitForStatusChangeToComplete(
      programIdVisa,
      1,
      RegistrationStatusEnum.deleted,
      8_000,
      accessToken,
    );

    // Act
    const name = seededFspConfigVoucher.financialServiceProvider;
    const result = await deleteProgramFinancialServiceProviderConfiguration({
      programId: programIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProgramFinancialServiceProviderConfigurations({
      programId: programIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );

    const getTranactions = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationOCW5.referenceId,
      accessToken,
    );

    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).not.toBeDefined();
    expect(
      getTranactions.body[0].programFinancialServiceProviderConfigurationId,
    ).toBe(null);
  });

  it('should add program financial service provider configuration properties to an existing program financial service provider configuration', async () => {
    // Prepare
    const createProgramFspConfigurationDtoNoProperties = {
      ...createProgramFspConfigurationDto,
      properties: undefined,
    };
    await postProgramFinancialServiceProviderConfiguration({
      programId: programIdVisa,
      body: createProgramFspConfigurationDtoNoProperties,
      accessToken,
    });

    // Act
    const result =
      await postProgramFinancialServiceProviderConfigurationProperties({
        programId: programIdVisa,
        properties: createProgramFspConfigurationDto.properties!,
        accessToken,
        name: createProgramFspConfigurationDto.name,
      });

    const getResult = await getProgramFinancialServiceProviderConfigurations({
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
    expect(getResultConfig?.properties).toEqual(result.body);
  });

  it('should patch a property of an existing program financial service provider configuration', async () => {
    // Prepare
    const updatedPropertyDto: UpdateProgramFinancialServiceProviderConfigurationPropertyDto =
      {
        value: 'user1234',
      };

    // Act
    const getResultBefore =
      await getProgramFinancialServiceProviderConfigurations({
        programId: programIdVisa,
        accessToken,
      });
    const usernamePropertyBefore = getResultBefore.body
      .find(
        (config) =>
          config.name === seededFspConfigVoucher.financialServiceProvider,
      )!
      .properties.find(
        (property) =>
          property.name ===
          FinancialServiceProviderConfigurationProperties.username,
      );

    const patchResult =
      await patchProgramFinancialServiceProviderConfigurationProperty({
        programId: programIdVisa,
        configName: seededFspConfigVoucher.financialServiceProvider,
        propertyName: FinancialServiceProviderConfigurationProperties.username,
        body: updatedPropertyDto,
        accessToken,
      });

    const getResultAfter =
      await getProgramFinancialServiceProviderConfigurations({
        programId: programIdVisa,
        accessToken,
      });
    const usernamePropertyAfter = getResultAfter.body
      .find(
        (config) =>
          config.name === seededFspConfigVoucher.financialServiceProvider,
      )!
      .properties.find(
        (property) =>
          property.name ===
          FinancialServiceProviderConfigurationProperties.username,
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

  it('should delete a property of an existing program financial service provider configuration', async () => {
    // Act
    const deleteResult =
      await deleteProgramFinancialServiceProviderConfigurationProperty({
        programId: programIdVisa,
        configName: seededFspConfigVoucher.financialServiceProvider,
        propertyName: FinancialServiceProviderConfigurationProperties.username,
        accessToken,
      });

    const getResultAfter =
      await getProgramFinancialServiceProviderConfigurations({
        programId: programIdVisa,
        accessToken,
      });
    const config = getResultAfter.body.find(
      (config) =>
        config.name === seededFspConfigVoucher.financialServiceProvider,
    );

    const usernamePropertyAfter = config?.properties.find(
      (property) =>
        property.name ===
        FinancialServiceProviderConfigurationProperties.username,
    );

    // Assert
    expect(deleteResult.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(usernamePropertyAfter).toBeUndefined();
    expect(config?.properties.length).toBe(
      seededFspConfigVoucher.properties.length - 1,
    );
  });
});
