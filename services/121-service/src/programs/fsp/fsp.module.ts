import { Module, HttpModule } from '@nestjs/common';
import { FspService } from './fsp.service';
import { FspController } from './fsp.controller';

@Module({
  imports: [HttpModule],
  providers: [FspService],
  controllers: [FspController],
  exports: [FspService],
})
export class FspModule {}
