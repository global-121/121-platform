import { Module } from '@nestjs/common';
import { IntersolveVisaMockController } from './intersolve-visa.mock.controller';
import { IntersolveVisaMockService } from './intersolve-visa.mock.service';

@Module({
  imports: [],
  providers: [IntersolveVisaMockService],
  controllers: [IntersolveVisaMockController],
  exports: [IntersolveVisaMockService],
})
export class IntersolveVisaMockModule {}
