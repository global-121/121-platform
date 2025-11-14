import { Module } from '@nestjs/common';

import { CooperativeBankOfOromiaMockController } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.mock.controller';
import { CooperativeBankOfOromiaMockService } from '@mock-service/src/fsp-integration/cooperative-bank-of-oromia/cooperative-bank-of-oromia.mock.service';

@Module({
  imports: [],
  providers: [CooperativeBankOfOromiaMockService],
  controllers: [CooperativeBankOfOromiaMockController],
  exports: [CooperativeBankOfOromiaMockService],
})
export class CooperativeBankOfOromiaMockModule {}
