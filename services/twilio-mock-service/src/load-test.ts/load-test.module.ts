import { Module } from '@nestjs/common';
import { LoadTestService } from './load-test.service';
import { LoadTestController } from './load-test.controller';

@Module({
  imports: [],
  providers: [LoadTestService],
  controllers: [LoadTestController],
  exports: [LoadTestService],
})
export class LoadTestModule {}
