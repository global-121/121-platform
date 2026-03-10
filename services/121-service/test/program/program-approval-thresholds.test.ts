import { HttpStatus } from '@nestjs/common';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getProgramApprovalThresholds,
  replaceProgramApprovalThresholds,
} from '@121-service/test/helpers/program-approval-threshold.helper';
import {
  createUserProgramAssignment,
  getCurrentUser,
} from '@121-service/test/helpers/user.helper';
import {
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
    await resetDB(SeedScript.nlrcMultiple, __filename);
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

  describe('replaceProgramApprovalThresholds', () => {
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
      const response = await replaceProgramApprovalThresholds({
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
      const initialResponse = await replaceProgramApprovalThresholds({
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

      const replaceResponse = await replaceProgramApprovalThresholds({
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
      const response = await replaceProgramApprovalThresholds({
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
      // Arrange
      const userId = 2; // User ID that exists in seed data
      const testScope = 'test-scope';
      const testRoles = ['view'];

      // Create the user assignment with scope
      await createUserProgramAssignment({
        programId,
        userId,
        roles: testRoles,
        scope: testScope,
        accessToken,
      });

      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          userIds: [userId],
        },
      ];

      // Act
      const response = await replaceProgramApprovalThresholds({
        programId,
        thresholds,
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toMatchInlineSnapshot(
        `"Only users without scope can be made approvers. The following user IDs have scoped assignments and cannot be approvers: 2"`,
      );
    });

    it('should throw BAD_REQUEST when duplicate approvers in threshold configuration', async () => {
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          userIds: [adminUserId],
        },
        {
          thresholdAmount: 50,
          userIds: [adminUserId],
        },
      ];

      // Act
      const response = await replaceProgramApprovalThresholds({
        programId,
        thresholds,
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toMatchInlineSnapshot(
        `"Approver user IDs must be unique across all thresholds. A user cannot be an approver for multiple thresholds."`,
      );
    });

    it('should throw BAD_REQUEST when threshold has no approvers', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          userIds: [],
        },
        {
          thresholdAmount: 100,
          userIds: [],
        },
      ];

      // Act
      const response = await replaceProgramApprovalThresholds({
        programId,
        thresholds,
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toMatchInlineSnapshot(
        `"All thresholds must have at least one approver. The following threshold amounts have no approvers: 0, 100"`,
      );
    });
  });
});
