import { Module } from '@nestjs/common';
import { LoadTestController } from './load-test.controller';
import { LoadTestService } from './load-test.service';

@Module({
  imports: [],
  providers: [LoadTestService],
  controllers: [LoadTestController],
  exports: [LoadTestService],
})
export class LoadTestModule {}
