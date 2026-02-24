import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApproverEntity } from '@121-service/src/programs/approver/entities/approver.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ProgramApprovalThresholdEntity } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.entity';
import { ProgramApprovalThresholdRepository } from '@121-service/src/programs/program-approval-thresholds/program-approval-threshold.repository';
import { ProgramApprovalThresholdsController } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.controller';
import { ProgramApprovalThresholdsService } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramApprovalThresholdEntity,
      ApproverEntity,
      ProgramAidworkerAssignmentEntity,
    ]),
  ],
  providers: [
    ProgramApprovalThresholdsService,
    ProgramApprovalThresholdRepository,
  ],
  controllers: [ProgramApprovalThresholdsController],
  exports: [ProgramApprovalThresholdsService],
})
export class ProgramApprovalThresholdsModule {}
