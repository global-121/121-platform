import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentApprovalEntity } from '@121-service/src/payments/entities/payment-approval.entity';
import { ApproversController } from '@121-service/src/programs/approvers/approvers.controller';
import { ApproversService } from '@121-service/src/programs/approvers/approvers.service';
import { ApproverEntity } from '@121-service/src/programs/approvers/entities/approver.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApproverEntity,
      ProgramAidworkerAssignmentEntity,
      PaymentApprovalEntity,
    ]),
  ],
  providers: [ApproversService],
  controllers: [ApproversController],
  exports: [ApproversService],
})
export class ApproversModule {}
