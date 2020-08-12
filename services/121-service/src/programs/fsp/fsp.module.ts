import { IntersolveApiService } from './intersolve-api.service';
import { Module, HttpModule } from '@nestjs/common';
import { FspService } from './fsp.service';
import { FspController } from './fsp.controller';
import { ApiService } from './api.service';

@Module({
  imports: [HttpModule],
  providers: [FspService, IntersolveApiService, ApiService],
  controllers: [FspController],
  exports: [FspService, IntersolveApiService, ApiService],
})
export class FspModule {}
