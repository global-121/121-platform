import { KoboConnectApiService } from '@121-service/src/kobo-connect/kobo-connect.api.service';
import { KoboConnectService } from '@121-service/src/kobo-connect/kobo-connect.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

@Module({
  imports: [HttpModule],
  providers: [CustomHttpService, KoboConnectApiService, KoboConnectService],
  exports: [KoboConnectService],
})
export class KoboConnectModule {}
