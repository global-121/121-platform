import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import {
  duplicateProgram,
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import {
  createOrReplaceProgramApprovalThresholdsWithNewUser,
  getProgramApprovalThresholds,
} from '@121-service/test/helpers/program-approval-threshold.helper';
import {
  getProgramFspConfigurations,
  postProgramFspConfiguration,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import { getAllUsersByProgramId } from '@121-service/test/helpers/user.helper';
import {
  createUserAssignedToProgram,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Duplicate program', () => {
  let accessToken: string;

  const sourceProgram: CreateProgramDto = {
    titlePortal: { en: 'Source program' },
    currency: CurrencyCode.EUR,
    languages: [RegistrationPreferredLanguage.en],
    description: { en: 'Program that gets duplicated' },
    targetNrRegistrations: 250,
    budget: 100000,
    fixedTransferValue: 25,
    validation: true,
    enableScope: false,
    enableMaxPayments: true,
    allowEmptyPhoneNumber: false,
  };

  const sourceFspConfiguration: CreateProgramFspConfigurationDto = {
    name: 'duplicate-test-visa',
    label: { en: 'Duplicate test FSP' },
    fspName: Fsps.intersolveVisa,
    properties: [
      { name: FspConfigurationProperties.brandCode, value: 'some-brand-code' },
      { name: FspConfigurationProperties.maxBalanceInCents, value: 15000 },
    ],
  };

  const lowThresholdAmount = 0;
  const highThresholdAmount = 5000;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();
  });

  it('should duplicate a program and its relations and persist it', async () => {
    // Arrange

    // Program
    const sourceProgramResult = await postProgram(sourceProgram, accessToken);
    const sourceProgramId = sourceProgramResult.body.id;

    // Fsp configuration
    await postProgramFspConfiguration({
      programId: sourceProgramId,
      body: sourceFspConfiguration,
      accessToken,
    });

    // Approval thresholds
    const [lowThresholdApproverId, highThresholdApproverId] =
      await Promise.all([
        createUserAssignedToProgram({
          programId: sourceProgramId,
          roles: [DefaultUserRole.View],
          adminAccessToken: accessToken,
        }),
        createUserAssignedToProgram({
          programId: sourceProgramId,
          roles: [DefaultUserRole.View],
          adminAccessToken: accessToken,
        }),
      ]);
    const sourceThresholds: CreateProgramApprovalThresholdDto[] = [
      {
        thresholdAmount: lowThresholdAmount,
        userIds: [lowThresholdApproverId],
      },
      {
        thresholdAmount: highThresholdAmount,
        userIds: [highThresholdApproverId],
      },
    ];
    await createOrReplaceProgramApprovalThresholdsWithNewUser({
      programId: sourceProgramId,
      thresholds: sourceThresholds,
    });

    const duplicateBody: CreateProgramDto = {
      ...sourceProgram,
      titlePortal: { en: 'Duplicated program' },
    };

    // Act
    const duplicateResponse = await duplicateProgram({
      copyFromProgramId: sourceProgramId,
      accessToken,
      body: duplicateBody,
    });

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);

    // Program
    const duplicatedProgramId = duplicateResponse.body.id;
    const duplicatedProgram = (
      await getProgram(duplicatedProgramId, accessToken)
    ).body;
    expect(duplicatedProgramId).not.toBe(sourceProgramId);
    expect(duplicatedProgram.titlePortal).toStrictEqual(
      duplicateBody.titlePortal,
    );
    expect(duplicatedProgram.currency).toBe(sourceProgram.currency);
    expect(duplicatedProgram.description).toStrictEqual(
      sourceProgram.description,
    );
    expect(duplicatedProgram.targetNrRegistrations).toBe(
      sourceProgram.targetNrRegistrations,
    );
    expect(duplicatedProgram.budget).toBe(sourceProgram.budget);
    expect(duplicatedProgram.fixedTransferValue).toBe(
      sourceProgram.fixedTransferValue,
    );
    expect(duplicatedProgram.validation).toBe(sourceProgram.validation);
    expect(duplicatedProgram.enableScope).toBe(sourceProgram.enableScope);
    expect(duplicatedProgram.enableMaxPayments).toBe(
      sourceProgram.enableMaxPayments,
    );

    // Fsp configurations
    const duplicatedFspConfigurations = (
      await getProgramFspConfigurations({
        programId: duplicatedProgramId,
        accessToken,
      })
    ).body;
    const duplicatedConfiguration = duplicatedFspConfigurations.find(
      (configuration) => configuration.name === sourceFspConfiguration.name,
    );
    expect(duplicatedConfiguration?.fspName).toBe(
      sourceFspConfiguration.fspName,
    );
    for (const property of sourceFspConfiguration.properties ?? []) {
      expect(getPropertyValue(duplicatedConfiguration, property.name)).toBe(
        property.value,
      );
    }

    // Aidworker assignments
    const sourceUsers: { id: number; roles: { role: string }[] }[] = (
      await getAllUsersByProgramId({
        programId: sourceProgramId,
        accessToken,
      })
    ).body;
    const duplicatedUsers: { id: number; roles: { role: string }[] }[] = (
      await getAllUsersByProgramId({
        programId: duplicatedProgramId,
        accessToken,
      })
    ).body;
    expect(rolesByUserId(duplicatedUsers)).toEqual(rolesByUserId(sourceUsers));

    // Approval thresholds
    const duplicatedThresholds = (
      await getProgramApprovalThresholds({
        programId: duplicatedProgramId,
        accessToken,
      })
    ).body;
    expect(approversByThresholdAmount(duplicatedThresholds)).toEqual(
      new Map([
        [lowThresholdAmount, [lowThresholdApproverId]],
        [highThresholdAmount, [highThresholdApproverId]],
      ]),
    );
  });

  // ---------------------------------------------------------------------------
  // Assertion helpers
  // ---------------------------------------------------------------------------

  function approversByThresholdAmount(
    thresholds: { thresholdAmount: number; approvers: { userId: number }[] }[],
  ): Map<number, number[]> {
    return new Map(
      thresholds.map((threshold) => [
        threshold.thresholdAmount,
        threshold.approvers.map((approver) => approver.userId).sort(),
      ]),
    );
  }

  function rolesByUserId(
    users: { id: number; roles: { role: string }[] }[],
  ): Map<number, string[]> {
    return new Map(
      users.map((user) => [
        user.id,
        user.roles.map((role) => role.role).sort(),
      ]),
    );
  }

  function getPropertyValue(
    configuration: ProgramFspConfigurationResponseDto | undefined,
    propertyName: FspConfigurationProperties,
  ) {
    return configuration?.properties.find(
      (property) => property.name === propertyName,
    )?.value;
  }
});
