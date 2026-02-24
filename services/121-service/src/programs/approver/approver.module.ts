import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApproverService } from '@121-service/src/programs/approver/approver.service';
import { ApproverEntity } from '@121-service/src/programs/approver/entities/approver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApproverEntity])],
  providers: [ApproverService],
  exports: [ApproverService],
})
export class ApproverModule {}
