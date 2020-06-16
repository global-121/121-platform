import { UserImsApiService } from './user-ims-api.service';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { ApiService } from './api.service';
import { Module, HttpModule } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [ApiService, ProgramsServiceApiService, UserImsApiService],
  exports: [ApiService, ProgramsServiceApiService, UserImsApiService],
})
export class ServicesModule {}
