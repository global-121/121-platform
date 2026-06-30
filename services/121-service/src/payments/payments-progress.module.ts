import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { PaymentsProgressService } from '@121-service/src/payments/services/payments-progress.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramEntity]), RedisModule],
  providers: [PaymentsProgressService],
  exports: [PaymentsProgressService],
})
export class PaymentsProgressModule {}
