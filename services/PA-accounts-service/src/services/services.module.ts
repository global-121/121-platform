import { ProgramsServiceApiService } from './programs-service-api.service';
import { ApiService } from './api.service';
import { Module, HttpModule } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [ApiService, ProgramsServiceApiService],
  exports: [ApiService, ProgramsServiceApiService],
})
export class ServicesModule {}
