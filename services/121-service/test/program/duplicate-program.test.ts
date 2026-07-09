import { HttpStatus } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationResponseDto } from '@121-service/src/program-fsp-configurations/dtos/program-fsp-configuration-response.dto';
import { propertiesToDuplicate } from '@121-service/src/programs/program-duplication.const';
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

    const sourceProgram = (await getProgram(copyFromProgramId, accessToken)).body;
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
    

    // Act
    const duplicateResponse = await duplicateProgram({
      copyFromProgramId,
      accessToken,
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
    expectDuplicatedColumnsMatchSource({ source: sourceProgram, duplicatedProgram });
    expectExcludedRelationsAreEmpty({ source: sourceProgram, duplicatedProgram });

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
      const duplicatedValue = getPropertyValue(duplicatedConfiguration, propertyName);
      expect(duplicatedValue).toBe(sourceValue);
    }

    // Aidworker assignments relation is duplicated.
    expect(duplicatedUsers.map((user) => user.id)).toEqual(
      expect.arrayContaining(sourceUsers.map((user) => user.id)),
    );

    // Approval thresholds are duplicated and their approver links re-pointed
    // to the copied thresholds.
    expect(
      duplicatedThresholds.map((threshold) => threshold.thresholdAmount).sort(),
    ).toEqual(
      sourceThresholds.map((threshold) => threshold.thresholdAmount).sort(),
    );
    const sourceApproverUserIds = collectApproverUserIds(sourceThresholds);
    const duplicatedApproverUserIds = collectApproverUserIds(duplicatedThresholds);
    expect(sourceApproverUserIds.length).toBeGreaterThan(0);
    expect(duplicatedApproverUserIds).toEqual(sourceApproverUserIds);
  });

  // ---------------------------------------------------------------------------
  // Assertion helpers
  // ---------------------------------------------------------------------------

  function expectDuplicatedColumnsMatchSource({
    source,
    duplicatedProgram,
  }: {
    source: Record<string, unknown>;
    duplicatedProgram: Record<string, unknown>;
  }): void {
    for (const [key, shouldCopy] of Object.entries(propertiesToDuplicate)) {
      // Only scalar columns flagged for duplication; relation arrays are
      // asserted separately.
      if (shouldCopy !== true) continue;
      if (!(key in source)) continue;
      if (isArrayOfObjects(source[key])) continue;

      expect(duplicatedProgram[key]).toStrictEqual(source[key]);
    }
  }

  function expectExcludedRelationsAreEmpty({
    source,
    duplicatedProgram,
  }: {
    source: Record<string, unknown>;
    duplicatedProgram: Record<string, unknown>;
  }): void {
    for (const [key, shouldCopy] of Object.entries(propertiesToDuplicate)) {
      if (shouldCopy !== false) continue;
      if (!(key in source)) continue;
      const sourceValue = source[key];
      if (!Array.isArray(sourceValue) || sourceValue.length === 0) continue;

      expect(duplicatedProgram[key] ?? []).toHaveLength(0);
    }
  }

  function collectApproverUserIds(
    thresholds: { approvers: { userId: number }[] }[],
  ): number[] {
    return thresholds
      .flatMap((threshold) =>
        threshold.approvers.map((approver) => approver.userId),
      )
      .sort();
  }

  function isArrayOfObjects(value: unknown): boolean {
    return (
      Array.isArray(value) && value.length > 0 && typeof value[0] === 'object'
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
