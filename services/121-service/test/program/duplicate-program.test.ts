import { HttpStatus } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  duplicateProgram,
  getProgram,
} from '@121-service/test/helpers/program.helper';
import { getProgramApprovalThresholds } from '@121-service/test/helpers/program-approval-threshold.helper';
import {
  getProgramFspConfigurations,
  postProgramFspConfiguration,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import { getAllUsersByProgramId } from '@121-service/test/helpers/user.helper';
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

  it('should duplicate a program and its relations and persist it', async () => {
    // Arrange
    const fspConfigurationName = `${'duplicate-test'}-${Date.now()}`;
    await postProgramFspConfiguration({
      programId: copyFromProgramId,
      body: {
        name: fspConfigurationName,
        label: { en: 'Duplicate test FSP' },
        fspName: Fsps.intersolveVisa,
        properties: [
          {
            name: FspConfigurationProperties.brandCode,
            value: 'some-brand-code',
          },
          {
            name: FspConfigurationProperties.maxBalanceInCents,
            value: 15000,
          },
        ],
      },
      accessToken,
    });

    const sourceProgram = (await getProgram(copyFromProgramId, accessToken))
      .body;
    const sourceUsers: { id: number }[] = (
      await getAllUsersByProgramId({
        programId: copyFromProgramId,
        accessToken,
      })
    ).body;
    const sourceThresholds = (
      await getProgramApprovalThresholds({
        programId: copyFromProgramId,
        accessToken,
      })
    ).body;
    const sourceFspConfigurations = (
      await getProgramFspConfigurations({
        programId: copyFromProgramId,
        accessToken,
      })
    ).body;
    // The source program has data worth duplicating.
    expect(sourceUsers.length).toBeGreaterThan(0);
    expect(sourceThresholds.length).toBeGreaterThan(0);
    expect(sourceProgram.fspConfigurations.length).toBeGreaterThan(0);

    // The frontend prefills the create form with the source program's data and
    // lets the user adjust it before submitting; here we change the title and
    // keep the rest.
    const duplicateBody: CreateProgramDto = {
      titlePortal: { en: 'Duplicated program' },
      currency: sourceProgram.currency,
      location: sourceProgram.location ?? undefined,
      ngo: sourceProgram.ngo ?? undefined,
      startDate: sourceProgram.startDate ?? undefined,
      endDate: sourceProgram.endDate ?? undefined,
      distributionFrequency: sourceProgram.distributionFrequency ?? undefined,
      distributionDuration: sourceProgram.distributionDuration ?? undefined,
      fixedTransferValue: sourceProgram.fixedTransferValue ?? undefined,
      paymentAmountMultiplierFormula:
        sourceProgram.paymentAmountMultiplierFormula ?? undefined,
      targetNrRegistrations: sourceProgram.targetNrRegistrations ?? undefined,
      description: sourceProgram.description ?? undefined,
      validation: sourceProgram.validation,
      languages: sourceProgram.languages,
      enableMaxPayments: sourceProgram.enableMaxPayments,
      enableScope: sourceProgram.enableScope,
      budget: sourceProgram.budget ?? undefined,
      allowEmptyPhoneNumber: sourceProgram.allowEmptyPhoneNumber,
    };

    // Act
    const duplicateResponse = await duplicateProgram({
      copyFromProgramId,
      accessToken,
      body: duplicateBody,
    });
    const duplicatedProgramId = duplicateResponse.body.id;
    const duplicatedProgram = (
      await getProgram(duplicatedProgramId, accessToken)
    ).body;
    const duplicatedUsers: { id: number }[] = (
      await getAllUsersByProgramId({
        programId: duplicatedProgramId,
        accessToken,
      })
    ).body;
    const duplicatedFspConfigurations = (
      await getProgramFspConfigurations({
        programId: duplicatedProgramId,
        accessToken,
      })
    ).body;
    const duplicatedThresholds = (
      await getProgramApprovalThresholds({
        programId: duplicatedProgramId,
        accessToken,
      })
    ).body;

    // Assert
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);

    // The new program is created from the submitted data, not blindly copied
    // from the source.
    expect(duplicatedProgram.id).not.toBe(sourceProgram.id);
    expect(duplicatedProgram.titlePortal).toStrictEqual(
      duplicateBody.titlePortal,
    );
    expect(duplicatedProgram.titlePortal).not.toStrictEqual(
      sourceProgram.titlePortal,
    );
    expect(duplicatedProgram.currency).toBe(duplicateBody.currency);
    expect(duplicatedProgram.targetNrRegistrations).toBe(
      duplicateBody.targetNrRegistrations,
    );
    expect(duplicatedProgram.validation).toBe(duplicateBody.validation);
    expect(duplicatedProgram.enableScope).toBe(duplicateBody.enableScope);

    // Fsp configurations and their property values are duplicated.
    expect(
      duplicatedFspConfigurations.map((configuration) => configuration.name),
    ).toEqual(
      expect.arrayContaining(
        sourceFspConfigurations.map((configuration) => configuration.name),
      ),
    );
    const sourceConfiguration = sourceFspConfigurations.find(
      (configuration) => configuration.name === fspConfigurationName,
    );
    const duplicatedConfiguration = duplicatedFspConfigurations.find(
      (configuration) => configuration.name === fspConfigurationName,
    );
    for (const propertyName of [
      FspConfigurationProperties.brandCode,
      FspConfigurationProperties.maxBalanceInCents,
    ]) {
      const sourceValue = getPropertyValue(sourceConfiguration, propertyName);
      const duplicatedValue = getPropertyValue(
        duplicatedConfiguration,
        propertyName,
      );
      expect(duplicatedValue).toBe(sourceValue);
    }

    // Aidworker assignments relation is duplicated.
    expect(duplicatedUsers.map((user) => user.id)).toEqual(
      expect.arrayContaining(sourceUsers.map((user) => user.id)),
    );

    // Approval thresholds are duplicated and their approver links re-pointed
    // to the copied thresholds
    const sourceApproversByAmount =
      approversByThresholdAmount(sourceThresholds);
    const duplicatedApproversByAmount =
      approversByThresholdAmount(duplicatedThresholds);
    expect(duplicatedApproversByAmount).toEqual(sourceApproversByAmount);
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

  function getPropertyValue(
    configuration: ProgramFspConfigurationResponseDto | undefined,
    propertyName: FspConfigurationProperties,
  ) {
    return configuration?.properties.find(
      (property) => property.name === propertyName,
    )?.value;
  }
});
