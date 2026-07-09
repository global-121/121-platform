import { HttpStatus } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
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
  postProgramFspConfigurationProperties,
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
    const fspConfigurationName =
      await createIntersolveVisaConfiguration('duplicate-test');
    const source = await getProgramById(copyFromProgramId);
    const sourceUsers: { id: number }[] =
      await getUsersOfProgram(copyFromProgramId);
    const sourceThresholds = await getThresholdsOfProgram(copyFromProgramId);
    expect(sourceUsers.length).toBeGreaterThan(0);
    expect(sourceThresholds.length).toBeGreaterThan(0);
    expect((source.fspConfigurations ?? []).length).toBeGreaterThan(0);

    // Act
    const newProgramId = await duplicateProgramExpectingSuccess();

    // Assert
    const duplicated = await getProgramById(newProgramId);
    expect(duplicated.id).not.toBe(source.id);
    expectDuplicatedColumnsMatchSource({ source, duplicated });
    expectExcludedRelationsAreEmpty({ source, duplicated });

    // Fsp configurations relation is duplicated.
    expect((duplicated.fspConfigurations ?? []).length).toBe(
      (source.fspConfigurations ?? []).length,
    );
    expect(
      (duplicated.fspConfigurations ?? []).some(
        (configuration) =>
          configuration.name === fspConfigurationName &&
          configuration.fspName === Fsps.intersolveVisa,
      ),
    ).toBe(true);

    // Aidworker assignments relation is duplicated.
    const duplicatedUsers: { id: number }[] =
      await getUsersOfProgram(newProgramId);
    expect(duplicatedUsers.map((user) => user.id)).toEqual(
      expect.arrayContaining(sourceUsers.map((user) => user.id)),
    );

    // Approval thresholds are duplicated and their approver links re-pointed
    // to the copied thresholds.
    const duplicatedThresholds = await getThresholdsOfProgram(newProgramId);
    expect(
      duplicatedThresholds.map((threshold) => threshold.thresholdAmount).sort(),
    ).toEqual(
      sourceThresholds.map((threshold) => threshold.thresholdAmount).sort(),
    );
    const sourceApproverUserIds = collectApproverUserIds(sourceThresholds);
    const duplicatedApproverUserIds =
      collectApproverUserIds(duplicatedThresholds);
    expect(sourceApproverUserIds.length).toBeGreaterThan(0);
    expect(duplicatedApproverUserIds).toEqual(sourceApproverUserIds);
  });

  it('should duplicate the FSP configuration properties', async () => {
    // Arrange
    const fspConfigurationName = await createIntersolveVisaConfiguration(
      'duplicate-properties-test',
    );
    await postProgramFspConfigurationProperties({
      programId: copyFromProgramId,
      name: fspConfigurationName,
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
      accessToken,
    });

    // Act
    const newProgramId = await duplicateProgramExpectingSuccess();

    // Assert
    const duplicatedConfigurations =
      await getFspConfigurationsOfProgram(newProgramId);
    const duplicatedConfiguration = duplicatedConfigurations.find(
      (configuration) => configuration.name === fspConfigurationName,
    );
    expect(duplicatedConfiguration).toBeDefined();
    const duplicatedPropertyNames = (
      duplicatedConfiguration?.properties ?? []
    ).map((property) => property.name);
    expect(duplicatedPropertyNames).toEqual(
      expect.arrayContaining([
        FspConfigurationProperties.brandCode,
        FspConfigurationProperties.maxBalanceInCents,
      ]),
    );
  });

  // ---------------------------------------------------------------------------
  // Arrange helpers
  // ---------------------------------------------------------------------------

  async function createIntersolveVisaConfiguration(
    namePrefix: string,
  ): Promise<string> {
    const name = `${namePrefix}-${Date.now()}`;
    await postProgramFspConfiguration({
      programId: copyFromProgramId,
      body: {
        name,
        label: { en: 'Duplicate test FSP' },
        fspName: Fsps.intersolveVisa,
      },
      accessToken,
    });
    return name;
  }

  async function duplicateProgramExpectingSuccess(): Promise<number> {
    const response = await duplicateProgram({ copyFromProgramId, accessToken });
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    return response.body.id;
  }

  // ---------------------------------------------------------------------------
  // Read helpers
  // ---------------------------------------------------------------------------

  async function getProgramById(programId: number) {
    return (await getProgram(programId, accessToken)).body;
  }

  async function getUsersOfProgram(programId: number) {
    return (await getAllUsersByProgramId({ programId, accessToken })).body;
  }

  async function getThresholdsOfProgram(programId: number) {
    return (await getProgramApprovalThresholds({ programId, accessToken })).body;
  }

  async function getFspConfigurationsOfProgram(programId: number) {
    return (await getProgramFspConfigurations({ programId, accessToken })).body;
  }

  // ---------------------------------------------------------------------------
  // Assertion helpers
  // ---------------------------------------------------------------------------

  function expectDuplicatedColumnsMatchSource({
    source,
    duplicated,
  }: {
    source: Record<string, unknown>;
    duplicated: Record<string, unknown>;
  }): void {
    for (const [key, shouldCopy] of Object.entries(propertiesToDuplicate)) {
      // Only scalar columns flagged for duplication; relation arrays are
      // asserted separately.
      if (shouldCopy !== true) continue;
      if (!(key in source)) continue;
      if (isArrayOfObjects(source[key])) continue;

      expect(duplicated[key]).toStrictEqual(source[key]);
    }
  }

  function expectExcludedRelationsAreEmpty({
    source,
    duplicated,
  }: {
    source: Record<string, unknown>;
    duplicated: Record<string, unknown>;
  }): void {
    for (const [key, shouldCopy] of Object.entries(propertiesToDuplicate)) {
      if (shouldCopy !== false) continue;
      if (!(key in source)) continue;
      const sourceValue = source[key];
      if (!Array.isArray(sourceValue) || sourceValue.length === 0) continue;

      expect(duplicated[key] ?? []).toHaveLength(0);
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
});
