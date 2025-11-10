import { Module } from '@nestjs/common';

import { CooperativeBankOromiaController } from '@mock-service/src/fsp-integration/cooperative-bank-oromia/cooperative-bank-oromia.mock.controller';
import { CooperativeBankOromiaService } from '@mock-service/src/fsp-integration/cooperative-bank-oromia/cooperative-bank-oromia.mock.service';

@Module({
  providers: [CooperativeBankOromiaService],
  controllers: [CooperativeBankOromiaController],
})
export class CooperativeBankOromiaModule {}
