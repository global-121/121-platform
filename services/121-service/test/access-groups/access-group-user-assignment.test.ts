import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import {
  AccessGroupPath,
  getAccessGroupAssignments,
  setupAccessGroupLevels,
} from '@121-service/test/helpers/access-group.helper';
import {
  assignUserAsApprover,
  createOrReplaceProgramApprovalThresholds,
} from '@121-service/test/helpers/program-approval-threshold.helper';
import {
  createUserProgramAssignment,
  getAllUsersByProgramId,
  getUserProgramAssignment,
  updateUserProgramAssignment,
} from '@121-service/test/helpers/user.helper';
import {
  createUserAssignedToProgram,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

// Only the main flows are covered here, the individual validation rules are covered by unit tests
// The effect of the access groups on what a user can see is covered by the other tests in this folder
describe('Access groups - setting the access groups of a user', () => {
  const noordHollandPath: AccessGroupPath = 'noord-holland/haarlem';
  const zuidHollandPath: AccessGroupPath = 'zuid-holland/rotterdam';
  // The path has two levels, so these are two access groups
  const noordHollandAccessGroups = getAccessGroupAssignments({
    path: noordHollandPath,
  });

  let accessTokenAdmin: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessTokenAdmin = await getAccessToken();

    await setupAccessGroupLevels({
      programId: programIdPV,
      paths: [noordHollandPath, zuidHollandPath],
      accessToken: accessTokenAdmin,
    });
  });

  describe('setting the access groups', () => {
    it('should store the access groups on the assignment, ordered by level regardless of the order they are sent in', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        adminAccessToken: accessTokenAdmin,
      });
      const accessGroupsLowestLevelFirst = [
        ...noordHollandAccessGroups,
      ].reverse();

      // Act
      const response = await createUserProgramAssignment({
        programId: programIdPV,
        userId,
        roles: [DefaultUserRole.View],
        accessGroups: accessGroupsLowestLevelFirst,
        accessToken: accessTokenAdmin,
      });
      const assignment = await getUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(assignment.body.accessGroups).toEqual(noordHollandAccessGroups);
    });

    it('should replace the existing access groups instead of merging them', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        adminAccessToken: accessTokenAdmin,
      });
      const newAccessGroups = getAccessGroupAssignments({
        path: 'zuid-holland',
      });

      // Act
      const response = await updateUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessGroups: newAccessGroups,
        accessToken: accessTokenAdmin,
      });
      const assignment = await getUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(assignment.body.accessGroups).toEqual(newAccessGroups);
    });

    it('should leave the access groups unchanged when they are omitted in an update', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        adminAccessToken: accessTokenAdmin,
      });

      // Act
      const response = await updateUserProgramAssignment({
        programId: programIdPV,
        userId,
        roles: [],
        accessToken: accessTokenAdmin,
      });
      const assignment = await getUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.accessGroups).toEqual(noordHollandAccessGroups);
      expect(assignment.body.accessGroups).toEqual(noordHollandAccessGroups);
    });

    it('should remove the access groups when an empty array is sent', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        adminAccessToken: accessTokenAdmin,
      });

      // Act
      const response = await updateUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessGroups: [],
        accessToken: accessTokenAdmin,
      });
      const assignment = await getUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(assignment.body.accessGroups).toEqual([]);
    });

    it('should reject a value that is not an option of the access group level and store nothing', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        adminAccessToken: accessTokenAdmin,
      });

      // Act
      const response = await createUserProgramAssignment({
        programId: programIdPV,
        userId,
        roles: [DefaultUserRole.View],
        accessGroups: [
          { programRegistrationAttributeName: 'province', value: 'utrecht' },
        ],
        accessToken: accessTokenAdmin,
      });
      const assignment = await getUserProgramAssignment({
        programId: programIdPV,
        userId,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe(
        "Value 'utrecht' is not an option of access group level 'province'",
      );
      expect(assignment.body.accessGroups).toEqual([]);
    });

    it('should reject access groups for a program without access group levels', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        adminAccessToken: accessTokenAdmin,
      });

      // Act
      const response = await createUserProgramAssignment({
        programId: programIdOCW,
        userId,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe(
        `No access group levels are configured for program ${programIdOCW}`,
      );
    });
  });

  describe('approvers', () => {
    it('should not allow access groups on an approver', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        adminAccessToken: accessTokenAdmin,
      });
      await assignUserAsApprover({
        programId: programIdPV,
        userId,
        accessToken: accessTokenAdmin,
      });

      // Act
      const response = await createUserProgramAssignment({
        programId: programIdPV,
        userId,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe(
        'Cannot add access groups to assignment because user is an approver for this program. Remove approver from program first (if intended) and retry.',
      );
    });

    it('should not allow a user with access groups to be made an approver', async () => {
      // Arrange
      const userId = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        adminAccessToken: accessTokenAdmin,
      });

      // Act
      const response = await createOrReplaceProgramApprovalThresholds({
        programId: programIdPV,
        thresholds: [{ thresholdAmount: 0, userIds: [userId] }],
        accessToken: accessTokenAdmin,
      });

      // Assert
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe(
        `Only users without access groups can be made approvers. The following user IDs have access groups and cannot be approvers: ${userId}`,
      );
    });

    it('should only mark users without access groups as eligible approvers', async () => {
      // Arrange
      const userIdWithAccessGroups = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        accessGroups: noordHollandAccessGroups,
        adminAccessToken: accessTokenAdmin,
      });
      const userIdWithoutAccessGroups = await createUserAssignedToProgram({
        programId: programIdPV,
        roles: [DefaultUserRole.View],
        adminAccessToken: accessTokenAdmin,
      });

      // Act
      const response = await getAllUsersByProgramId({
        programId: programIdPV,
        accessToken: accessTokenAdmin,
      });

      // Assert
      const users: {
        id: number;
        isEligiblePaymentApprover: boolean;
        accessGroups: { programRegistrationAttributeName: string; value: string }[];
      }[] = response.body;
      const userWithAccessGroups = users.find(
        ({ id }) => id === userIdWithAccessGroups,
      );
      const userWithoutAccessGroups = users.find(
        ({ id }) => id === userIdWithoutAccessGroups,
      );
      expect(userWithAccessGroups?.isEligiblePaymentApprover).toBe(false);
      expect(userWithAccessGroups?.accessGroups).toEqual(noordHollandAccessGroups);
      expect(userWithoutAccessGroups?.isEligiblePaymentApprover).toBe(true);
      expect(userWithoutAccessGroups?.accessGroups).toEqual([]);
    });
  });
});
