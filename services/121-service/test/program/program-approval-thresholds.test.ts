import { HttpStatus } from '@nestjs/common';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getProgramApprovalThresholds,
  putProgramApprovalThresholds,
} from '@121-service/test/helpers/program-approval-threshold.helper';
import {
  createUserProgramAssignment,
  getAllUsersByProgramId,
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
      // Note: Using assignment ID from seed data (admin assignment for program 2)
      // The seed creates an admin assignment which we can use for testing
      const adminAssignmentId = 16;

      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 50,
          approvers: [{ programAidworkerAssignmentId: adminAssignmentId }],
        },
        {
          thresholdAmount: 100,
          approvers: [],
        },
      ];

      // Act
      const response = await putProgramApprovalThresholds(
        programId,
        thresholds,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveLength(2);

      expect(response.body[0].thresholdAmount).toBe(50);
      expect(response.body[0].approvers).toHaveLength(1);
      expect(response.body[0].approvers[0].order).toBe(1);

      expect(response.body[1].thresholdAmount).toBe(100);
      expect(response.body[1].approvers).toHaveLength(0);
    });

    it('should replace existing thresholds', async () => {
      // Arrange: Create initial thresholds
      const initialThresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, approvers: [] },
        { thresholdAmount: 50, approvers: [] },
      ];

      const initialResponse = await putProgramApprovalThresholds(
        programId,
        initialThresholds,
        accessToken,
      );
      expect(initialResponse.status).toBe(HttpStatus.CREATED);
      expect(initialResponse.body).toHaveLength(2);

      // Act: Replace with new thresholds
      const newThresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 0, approvers: [] },
        { thresholdAmount: 100, approvers: [] },
        { thresholdAmount: 200, approvers: [] },
      ];

      const response = await putProgramApprovalThresholds(
        programId,
        newThresholds,
        accessToken,
      );

      // Assert: Old thresholds should be replaced
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].thresholdAmount).toBe(0);
      expect(response.body[1].thresholdAmount).toBe(100);
      expect(response.body[2].thresholdAmount).toBe(200);

      // Verify via GET
      const getResponse = await getProgramApprovalThresholds(
        programId,
        accessToken,
      );
      expect(getResponse.status).toBe(HttpStatus.OK);
      expect(getResponse.body).toHaveLength(3);
    });

    it('should throw BAD_REQUEST when aidworker assignment not found', async () => {
      // Arrange
      const nonExistentId = 999999;
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [{ programAidworkerAssignmentId: nonExistentId }],
        },
      ];

      // Act
      const response = await putProgramApprovalThresholds(
        programId,
        thresholds,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain(
        `Program aidworker assignment with ID ${nonExistentId} not found`,
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

      // Get the program aidworker assignment ID for the scoped user
      const allUsersResponse = await getAllUsersByProgramId(
        accessToken,
        programId.toString(),
      );
      const scopedUserAssignment = allUsersResponse.body.find(
        (u: any) => u.id === userId,
      );
      const scopedAidworkerId =
        scopedUserAssignment.programAidworkerAssignmentId;

      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [{ programAidworkerAssignmentId: scopedAidworkerId }],
        },
      ];

      // Act
      const response = await putProgramApprovalThresholds(
        programId,
        thresholds,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain(
        `Only users without scope can be made approvers`,
      );
      expect(response.body.message).toContain(
        `Program aidworker assignment ${scopedAidworkerId} has a scope`,
      );
    });

    it('should throw BAD_REQUEST when duplicate approver in same threshold', async () => {
      // Using admin assignment from seed data
      const aidworkerId = 16;

      const thresholds: CreateProgramApprovalThresholdDto[] = [
        {
          thresholdAmount: 0,
          approvers: [
            { programAidworkerAssignmentId: aidworkerId },
            { programAidworkerAssignmentId: aidworkerId },
          ],
        },
      ];

      // Act
      const response = await putProgramApprovalThresholds(
        programId,
        thresholds,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain(
        `Program aidworker assignment ${aidworkerId} is already an approver`,
      );
      expect(response.body.message).toContain('threshold with amount 0');
    });

    it('should throw BAD_REQUEST for duplicate threshold amounts', async () => {
      // Arrange
      const thresholds: CreateProgramApprovalThresholdDto[] = [
        { thresholdAmount: 100, approvers: [] },
        { thresholdAmount: 100, approvers: [] },
      ];

      // Act
      const response = await putProgramApprovalThresholds(
        programId,
        thresholds,
        accessToken,
      );

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain(
        'Threshold amounts must be unique',
      );
    });
  });
});
