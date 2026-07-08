import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { propertiesToDuplicate } from '@121-service/src/programs/program-duplication.const';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  duplicateProgram,
  getProgram,
} from '@121-service/test/helpers/program.helper';
import { getProgramApprovalThresholds } from '@121-service/test/helpers/program-approval-threshold.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
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
    const fspConfigurationName = `duplicate-test-${Date.now()}`;
    await postProgramFspConfiguration({
      programId: copyFromProgramId,
      body: {
        name: fspConfigurationName,
        label: { en: 'Duplicate test FSP' },
        fspName: Fsps.intersolveVisa,
      },
      accessToken,
    });

    const source = (await getProgram(copyFromProgramId, accessToken)).body;
    const sourceFspConfigurations = source.fspConfigurations ?? [];
    const sourceUsers: { id: number }[] = (
      await getAllUsersByProgramId({
        programId: copyFromProgramId,
        accessToken,
      })
    ).body;
    expect(sourceUsers.length).toBeGreaterThan(0);
    const sourceThresholds = (
      await getProgramApprovalThresholds({
        programId: copyFromProgramId,
        accessToken,
      })
    ).body;
    expect(sourceThresholds.length).toBeGreaterThan(0);

    // Act
    const duplicateResponse = await duplicateProgram({
      copyFromProgramId,
      accessToken,
    });
    expect(duplicateResponse.statusCode).toBe(HttpStatus.CREATED);

    const newProgramId = duplicateResponse.body.id;
    const duplicated = (await getProgram(newProgramId, accessToken)).body;

    // Assert
    // Scalar columns that SHOULD be copied (propertiesToDuplicate: true)
    for (const [key, shouldCopy] of Object.entries(propertiesToDuplicate)) {
      if (shouldCopy !== true) continue;
      if (!(key in source)) continue;
      if (
        Array.isArray(source[key]) &&
        source[key].length > 0 &&
        typeof source[key][0] === 'object'
      ) {
        continue;
      }

      expect(duplicated[key]).toStrictEqual(source[key]);
    }

    // The duplicate is a new entity.
    expect(duplicated.id).not.toBe(source.id);

    // Array relations in the GET response that should be empty in the duplicate.
    for (const [key, shouldCopy] of Object.entries(propertiesToDuplicate)) {
      if (shouldCopy !== false) continue;
      if (!(key in source)) continue;
      if (!Array.isArray(source[key]) || source[key].length === 0) continue;

      expect(duplicated[key] ?? []).toHaveLength(0);
    }

    // Fsp configurations relation is duplicated.
    const duplicatedFspConfigurations = duplicated.fspConfigurations ?? [];
    expect(sourceFspConfigurations.length).toBeGreaterThan(0);
    expect(duplicatedFspConfigurations.length).toBe(
      sourceFspConfigurations.length,
    );
    expect(
      duplicatedFspConfigurations.some(
        (configuration) =>
          configuration.name === fspConfigurationName &&
          configuration.fspName === Fsps.intersolveVisa,
      ),
    ).toBe(true);

    // Aidworker assignments relation is duplicated.
    const duplicatedUsers: { id: number }[] = (
      await getAllUsersByProgramId({
        programId: newProgramId,
        accessToken,
      })
    ).body;
    const sourceUserIds = sourceUsers.map((user) => user.id);
    const duplicatedUserIds = duplicatedUsers.map((user) => user.id);
    expect(duplicatedUserIds).toEqual(expect.arrayContaining(sourceUserIds));

    // Approval thresholds are duplicated and their approver links re-pointed
    // to the copied thresholds.
    const duplicatedThresholds = (
      await getProgramApprovalThresholds({
        programId: newProgramId,
        accessToken,
      })
    ).body;
    expect(duplicatedThresholds.map((t) => t.thresholdAmount).sort()).toEqual(
      sourceThresholds.map((t) => t.thresholdAmount).sort(),
    );
    const sourceApproverUserIds = sourceThresholds
      .flatMap((threshold) =>
        threshold.approvers.map((approver) => approver.userId),
      )
      .sort();
    const duplicatedApproverUserIds = duplicatedThresholds
      .flatMap((threshold) =>
        threshold.approvers.map((approver) => approver.userId),
      )
      .sort();
    expect(sourceApproverUserIds.length).toBeGreaterThan(0);
    expect(duplicatedApproverUserIds).toEqual(sourceApproverUserIds);
  });
});
