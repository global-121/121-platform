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

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  describe('replaceProgramApprovalThresholds', () => {
    it('should successfully create thresholds with approvers', async () => {
      const adminUser = await getCurrentUser({ accessToken });

      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 50,
          userIds: [adminUser.body.user.id],
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
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveLength(2);

      expect(response.body[0].thresholdAmount).toBe(50);
      expect(response.body[0].approvers).toHaveLength(1);

      expect(response.body[1].thresholdAmount).toBe(100);
      expect(response.body[1].approvers).toHaveLength(0);
    });

    it('should replace existing thresholds', async () => {
      // Arrange: Create initial thresholds
      const initialThresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [] },
        { thresholdAmount: 50, userIds: [] },
      ];

      const initialResponse = await replaceProgramApprovalThresholds({
        programId,
        thresholds: initialThresholds,
        accessToken,
      });
      expect(initialResponse.status).toBe(HttpStatus.CREATED);
      expect(initialResponse.body).toHaveLength(2);

      // Act: Replace with new thresholds
      const newThresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, userIds: [] },
        { thresholdAmount: 100, userIds: [] },
        { thresholdAmount: 200, userIds: [] },
      ];

      const response = await replaceProgramApprovalThresholds({
        programId,
        thresholds: newThresholds,
        accessToken,
      });

      // Assert: Old thresholds should be replaced
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].thresholdAmount).toBe(0);
      expect(response.body[1].thresholdAmount).toBe(100);
      expect(response.body[2].thresholdAmount).toBe(200);

      // Verify via GET
      const getResponse = await getProgramApprovalThresholds({
        programId,
        accessToken,
      });
      expect(getResponse.status).toBe(HttpStatus.OK);
      expect(getResponse.body).toHaveLength(3);
    });

    it('should throw BAD_REQUEST when user has no program assignment', async () => {
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
      expect(response.body.message).toContain(
        `The following user IDs are not assigned to the program and cannot be approvers: ${nonExistentUserId}`,
      );
    });

    it('should throw BAD_REQUEST when aidworker has scope', async () => {
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
      expect(response.body.message).toContain(
        `Only users without scope can be made approvers`,
      );
      expect(response.body.message).toContain(
        `The following user IDs have scoped assignments and cannot be approvers: ${userId}`,
      );
    });

    it('should throw BAD_REQUEST when duplicate approver in same threshold', async () => {
      const adminUser = await getCurrentUser({ accessToken });
      const userId = adminUser.body.user.id;

      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          userIds: [userId, userId],
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
      expect(response.body.message).toContain(
        `Approver user IDs must be unique across all thresholds`,
      );
    });

    it('should throw BAD_REQUEST for duplicate threshold amounts', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 100, userIds: [] },
        { thresholdAmount: 100, userIds: [] },
      ];

      // Act
      const response = await replaceProgramApprovalThresholds({
        programId,
        thresholds,
        accessToken,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain(
        'Threshold amounts must be unique',
      );
    });
  });
});
