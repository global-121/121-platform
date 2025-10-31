import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { ProgramPaymentLockEntity } from '@121-service/src/programs/program-payment-locks/program-payment-lock.entity';
import { ProgramPaymentsLocksService } from '@121-service/src/programs/program-payment-locks/program-payment-locks.service';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([ProgramPaymentLockEntity])],
  controllers: [],
  providers: [ProgramPaymentsLocksService],
  exports: [ProgramPaymentsLocksService],
})
export class ProgramPaymentLocksModule {}
