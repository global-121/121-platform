import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApproversService } from '@121-service/src/programs/approvers/approvers.service';
import { ApproverEntity } from '@121-service/src/programs/approvers/entities/approver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApproverEntity])],
  providers: [ApproversService],
  exports: [ApproversService],
})
export class ApproversModule {}
