import { GetProgramApprovalThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/get-program-approval-threshold-response.dto';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';

export class ProgramApprovalThresholdMapper {
  public static mapEntityToDto(
    entity: ProgramApprovalThresholdEntity,
  ): GetProgramApprovalThresholdResponseDto {
    return {
      id: entity.id,
      thresholdAmount: entity.thresholdAmount,
      approvers: entity.approverAssignments
        .sort((a, b) => a.id - b.id)
        .map((assignment) => ({
          id: assignment.id,
          userId: assignment.user.id,
          username: assignment.user.username,
        })),
    };
  }
}
