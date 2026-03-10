import { HttpStatus } from '@nestjs/common';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createOrReplaceProgramApprovalThresholds,
  getProgramApprovalThresholds,
} from '@121-service/test/helpers/program-approval-threshold.helper';
import {
  createUserProgramAssignment,
  getCurrentUser,
} from '@121-service/test/helpers/user.helper';
import {
  createUser,
  findUserByUsername,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Program Approval Thresholds', () => {
  let accessToken: string;
  const programId = 2;
  let adminUserId: number;
  const userId2 = 2;
  const userId3 = 3;

  beforeAll(async () => {
    await resetDB(
      SeedScript.nlrcMultiple,
      __filename,
      false,
      ApproverSeedMode.none,
    );
    accessToken = await getAccessToken();

    // Get admin user ID
    const adminUser = await getCurrentUser({ accessToken });
    adminUserId = adminUser.body.user.id;

    // Create common test users that most tests need
    await createUserProgramAssignment({
      programId,
      userId: userId2,
      roles: ['view'],
      accessToken,
    });
    await createUserProgramAssignment({
      programId,
      userId: userId3,
      roles: ['view'],
      accessToken,
    });
  });

  describe('createOrReplaceProgramApprovalThresholds', () => {
    it('should successfully create thresholds with approvers', async () => {
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 50,
          userIds: [adminUserId],
        },
        {
          thresholdAmount: 100,
          userIds: [userId2],
        },
      ];

      // Act
      const response = await createOrReplaceProgramApprovalThresholds({
        programId,
        thresholds,
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveLength(2);

      expect(response.body[0].thresholdAmount).toBe(50);
      expect(response.body[0].approvers).toHaveLength(1);

      expect(response.body[1].thresholdAmount).toBe(100);
      expect(response.body[1].approvers).toHaveLength(1);
    });

    it('should replace existing thresholds', async () => {
      // Arrange
      const initialThresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [adminUserId] },
        { thresholdAmount: 50, userIds: [userId2] },
      ];
      const initialResponse = await createOrReplaceProgramApprovalThresholds({
        programId,
        thresholds: initialThresholds,
        accessToken,
      });

      // Act: Replace with new thresholds
      const newThresholdAmounts = [0, 100, 200];
      const newThresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [adminUserId] },
        { thresholdAmount: 100, userIds: [userId2] },
        { thresholdAmount: 200, userIds: [userId3] },
      ];

      const replaceResponse = await createOrReplaceProgramApprovalThresholds({
        programId,
        thresholds: newThresholds,
        accessToken,
      });

      // Assert: Old thresholds should be replaced
      expect(initialResponse.status).toBe(HttpStatus.CREATED);
      expect(initialResponse.body).toHaveLength(2);
      expect(replaceResponse.status).toBe(HttpStatus.CREATED);
      expect(replaceResponse.body).toIncludeSamePartialMembers(
        newThresholdAmounts.map((thresholdAmount) => ({ thresholdAmount })),
      );

      // Verify via GET
      const getResponse = await getProgramApprovalThresholds({
        programId,
        accessToken,
      });
      expect(getResponse.body).toEqual(replaceResponse.body);
    });

    it('should throw BAD_REQUEST when a user has no program assignment', async () => {
      // Arrange
      const nonExistentUserId = 999999;
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          userIds: [nonExistentUserId],
        },
      ];

      // Act
      const response = await createOrReplaceProgramApprovalThresholds({
        programId,
        thresholds,
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toMatchInlineSnapshot(
        `"The following user IDs are not assigned to the program and cannot be approvers: 999999"`,
      );
    });

    it('should throw BAD_REQUEST when an assigned aidworker has scope', async () => {
      // Arrange: use a fresh user to avoid polluting shared test state
      const username = `scoped-approver-test@example.org`;
      await createUser({
        username,
        displayName: 'Scoped Approver Test User',
        adminAccessToken: accessToken,
      });
      const userId = await findUserByUsername({
        programId,
        username,
        adminAccessToken: accessToken,
      });
      await createUserProgramAssignment({
        programId,
        userId,
        roles: ['view'],
        scope: 'test-scope',
        accessToken,
      });

      // Act
      const response = await createOrReplaceProgramApprovalThresholds({
        programId,
        thresholds: [{ thresholdAmount: 0, userIds: [userId] }],
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe(
        `Only users without scope can be made approvers. The following user IDs have scoped assignments and cannot be approvers: ${userId}`,
      );
    });
  });
});
