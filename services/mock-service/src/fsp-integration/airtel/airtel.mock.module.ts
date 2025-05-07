import { Module } from '@nestjs/common';

import { AirtelMockController } from '@mock-service/src/fsp-integration/airtel/airtel.mock.controller';
import { AirtelMockService } from '@mock-service/src/fsp-integration/airtel/airtel.mock.service';

@Module({
  imports: [],
  providers: [AirtelMockService],
  controllers: [AirtelMockController],
  exports: [AirtelMockService],
})
export class AirtelMockModule {}
