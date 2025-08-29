/* eslint-disable jest/no-conditional-expect */
import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { CreateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/create-project-fsp-configuration.dto';
import { UpdateProjectFspConfigurationDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration.dto';
import { UpdateProjectFspConfigurationPropertyDto } from '@121-service/src/project-fsp-configurations/dtos/update-project-fsp-configuration-property.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { projectIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { paymentIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import projectOCW from '@121-service/src/seed-data/project/project-nlrc-ocw.json';
import { getTransactions } from '@121-service/test/helpers/project.helper';
import {
  deleteProjectFspConfiguration,
  deleteProjectFspConfigurationProperty,
  getProjectFspConfigurationProperties,
  getProjectFspConfigurations,
  patchProjectFspConfiguration,
  patchProjectFspConfigurationProperty,
  postProjectFspConfiguration,
  postProjectFspConfigurationProperties,
} from '@121-service/test/helpers/project-fsp-configuration.helper';
import {
  awaitChangeRegistrationStatus,
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

const hiddenString = '[********]';

const seededFspConfigVoucher = projectOCW.projectFspConfigurations.find(
  (fspConfig) => fspConfig.fsp === Fsps.intersolveVoucherWhatsapp,
)!;

const createProjectFspConfigurationDto: CreateProjectFspConfigurationDto = {
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

  it('should add project Fsp configuration to an existing project', async () => {
    // Act
    const result = await postProjectFspConfiguration({
      projectId: projectIdVisa,
      body: createProjectFspConfigurationDto,
      accessToken,
    });
    const getResult = await getProjectFspConfigurations({
      projectId: projectIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === createProjectFspConfigurationDto.name,
    );
    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    expect(result.body).toEqual(
      expect.objectContaining({
        name: createProjectFspConfigurationDto.name,
        label: createProjectFspConfigurationDto.label,
        fspName: createProjectFspConfigurationDto.fspName,
      }),
    );
    const propertyNamesResult = result.body.properties
      .map((property) => property.name)
      .sort();
    const propertyNamesExpected = createProjectFspConfigurationDto
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

  it('should patch existing project Fsp configuration', async () => {
    // Act
    const updateProjectFspConfigurationDto: UpdateProjectFspConfigurationDto = {
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
    const result = await patchProjectFspConfiguration({
      projectId: projectIdVisa,
      name,
      body: updateProjectFspConfigurationDto,
      accessToken,
    });
    const getResult = await getProjectFspConfigurations({
      projectId: projectIdVisa,
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
        label: updateProjectFspConfigurationDto.label,
        fspName: seededFspConfigVoucher.fsp,
      }),
    );
    const propertyNamesResult = result.body.properties.map(
      (property) => property.name,
    );
    const propertyNamesExpected =
      updateProjectFspConfigurationDto.properties!.map(
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

  it('should delete existing project Fsp configuration', async () => {
    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProjectFspConfiguration({
      projectId: projectIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProjectFspConfigurations({
      projectId: projectIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );
    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).toBeUndefined();
  });

  it('should not delete existing project Fsp configuration because of active registrations with that config', async () => {
    // Prepare
    await seedPaidRegistrations([registrationOCW5], projectIdVisa);

    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProjectFspConfiguration({
      projectId: projectIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProjectFspConfigurations({
      projectId: projectIdVisa,
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
  it('deleting project Fsp configuration with existing transactions should set projectFspConfigurationId of transactions to null', async () => {
    // Prepare
    await seedPaidRegistrations([registrationOCW5], projectIdVisa);

    await awaitChangeRegistrationStatus({
      projectId: projectIdVisa,
      referenceIds: [registrationOCW5.referenceId],
      status: RegistrationStatusEnum.declined,
      accessToken,
    });
    await deleteRegistrations({
      projectId: projectIdVisa,
      referenceIds: [registrationOCW5.referenceId],
      accessToken,
    });
    await waitForStatusChangeToComplete(
      projectIdVisa,
      1,
      RegistrationStatusEnum.deleted,
      8_000,
      accessToken,
    );

    // Act
    const name = seededFspConfigVoucher.fsp;
    const result = await deleteProjectFspConfiguration({
      projectId: projectIdVisa,
      name,
      accessToken,
    });
    const getResult = await getProjectFspConfigurations({
      projectId: projectIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === name,
    );

    const getTranactions = await getTransactions({
      projectId: projectIdVisa,
      paymentId: paymentIdVisa,
      registrationReferenceId: registrationOCW5.referenceId,
      accessToken,
    });

    // Assert
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(getResultConfig).not.toBeDefined();
    expect(getTranactions.body[0].projectFspConfigurationName).toBe(null);
  });

  it('should add project Fsp configuration properties to an existing project Fsp configuration', async () => {
    // Prepare
    const createProjectFspConfigurationDtoNoProperties = {
      ...createProjectFspConfigurationDto,
      properties: undefined,
    };
    await postProjectFspConfiguration({
      projectId: projectIdVisa,
      body: createProjectFspConfigurationDtoNoProperties,
      accessToken,
    });

    // Act
    const result = await postProjectFspConfigurationProperties({
      projectId: projectIdVisa,
      properties: createProjectFspConfigurationDto.properties!,
      accessToken,
      name: createProjectFspConfigurationDto.name,
    });

    const getResult = await getProjectFspConfigurations({
      projectId: projectIdVisa,
      accessToken,
    });
    const getResultConfig = getResult.body.find(
      (config) => config.name === createProjectFspConfigurationDto.name,
    );

    // Assert
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    const propertyNamesResult = result.body.map((property) => property.name);
    const propertyNamesExpected =
      createProjectFspConfigurationDto.properties!.map(
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

  it('should patch a property of an existing project Fsp configuration', async () => {
    // Prepare
    const updatedPropertyDto: UpdateProjectFspConfigurationPropertyDto = {
      value: 'user1234',
    };

    // Act
    const getResultBefore = await getProjectFspConfigurations({
      projectId: projectIdVisa,
      accessToken,
    });
    const usernamePropertyBefore = getResultBefore.body
      .find((config) => config.name === seededFspConfigVoucher.fsp)!
      .properties.find(
        (property) => property.name === FspConfigurationProperties.username,
      );

    const patchResult = await patchProjectFspConfigurationProperty({
      projectId: projectIdVisa,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      body: updatedPropertyDto,
      accessToken,
    });

    const getResultAfter = await getProjectFspConfigurations({
      projectId: projectIdVisa,
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

  it('should delete a property of an existing project Fsp configuration', async () => {
    // Act
    const deleteResult = await deleteProjectFspConfigurationProperty({
      projectId: projectIdVisa,
      configName: seededFspConfigVoucher.fsp,
      propertyName: FspConfigurationProperties.username,
      accessToken,
    });

    const getResultAfter = await getProjectFspConfigurations({
      projectId: projectIdVisa,
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

  it('Should return all visible properties of a project Fsp configuration', async () => {
    // Arrange
    const enumValues = Object.values(FspConfigurationProperties);
    // Act
    const getVisibleProperties = await getProjectFspConfigurationProperties({
      projectId: projectIdVisa,
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

  it('Returns masked values for hidden properties of a project Fsp configuration', async () => {
    // Act
    const getHiddenProperties = await getProjectFspConfigurationProperties({
      projectId: projectIdVisa,
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
});
