import { LoadTestController } from '@mock-service/src/load-test/load-test.controller';
import { LoadTestService } from '@mock-service/src/load-test/load-test.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [LoadTestService],
  controllers: [LoadTestController],
  exports: [LoadTestService],
})
export class LoadTestModule {}
