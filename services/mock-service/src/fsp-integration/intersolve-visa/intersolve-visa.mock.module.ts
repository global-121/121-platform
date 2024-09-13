import { Module } from '@nestjs/common';

import { IntersolveVisaMockController } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.controller';
import { IntersolveVisaMockService } from '@mock-service/src/fsp-integration/intersolve-visa/intersolve-visa.mock.service';

@Module({
  imports: [],
  providers: [IntersolveVisaMockService],
  controllers: [IntersolveVisaMockController],
  exports: [IntersolveVisaMockService],
})
export class IntersolveVisaMockModule {}
