import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ApproverController } from '@121-service/src/user/approver/approver.controller';
import { ApproverService } from '@121-service/src/user/approver/approver.service';
import { ApproverEntity } from '@121-service/src/user/approver/entities/approver.entity';
import { PaymentApprovalEntity } from '@121-service/src/user/approver/entities/payment-approval.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApproverEntity,
      ProgramAidworkerAssignmentEntity,
      PaymentApprovalEntity,
    ]),
  ],
  providers: [ApproverService],
  controllers: [ApproverController],
  exports: [ApproverService],
})
export class ApproverModule {}
