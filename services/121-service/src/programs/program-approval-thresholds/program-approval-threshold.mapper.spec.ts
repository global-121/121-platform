import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker-assignments/program-aidworker-assignment.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdMapper } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.mapper';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

const createAssignment = (
  overrides: Partial<ProgramAidworkerAssignmentEntity> = {},
): ProgramAidworkerAssignmentEntity => {
  const assignment = new ProgramAidworkerAssignmentEntity();
  assignment.id = 1;
  assignment.userId = 10;
  assignment.user = { id: 10, username: 'test@example.org' } as UserEntity;
  return Object.assign(assignment, overrides);
};

const createThresholdEntity = (
  overrides: Partial<ProgramApprovalThresholdEntity> = {},
): ProgramApprovalThresholdEntity => {
  const entity = new ProgramApprovalThresholdEntity();
  entity.id = 1;
  entity.thresholdAmount = 500;
  entity.approverAssignments = [];
  return Object.assign(entity, overrides);
};

describe('ProgramApprovalThresholdMapper', () => {
  describe('mapEntityToDto', () => {
    it('should map id and thresholdAmount', () => {
      const entity = createThresholdEntity({ id: 42, thresholdAmount: 1000 });

      const result = ProgramApprovalThresholdMapper.mapEntityToDto(entity);

      expect(result.id).toBe(42);
      expect(result.thresholdAmount).toBe(1000);
    });

    it('should map approver assignments to approvers', () => {
      const entity = createThresholdEntity({
        approverAssignments: [
          createAssignment({
            id: 5,
            userId: 10,
            user: { id: 10, username: 'approver@example.org' } as UserEntity,
          }),
        ],
      });

      const result = ProgramApprovalThresholdMapper.mapEntityToDto(entity);

      expect(result.approvers).toHaveLength(1);
      expect(result.approvers[0]).toEqual({
        id: 5,
        userId: 10,
        username: 'approver@example.org',
      });
    });

    it('should sort approvers by assignment id ascending', () => {
      const entity = createThresholdEntity({
        approverAssignments: [
          createAssignment({
            id: 30,
            userId: 3,
            user: { id: 3, username: 'c@example.org' } as UserEntity,
          }),
          createAssignment({
            id: 10,
            userId: 1,
            user: { id: 1, username: 'a@example.org' } as UserEntity,
          }),
          createAssignment({
            id: 20,
            userId: 2,
            user: { id: 2, username: 'b@example.org' } as UserEntity,
          }),
        ],
      });

      const result = ProgramApprovalThresholdMapper.mapEntityToDto(entity);

      expect(result.approvers.map((a) => a.id)).toEqual([10, 20, 30]);
    });
  });
});
