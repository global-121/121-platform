import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CustomHttpService } from '../shared/services/custom-http.service';
import { KoboConnectApiService } from './kobo-connect.api.service';
import { KoboConnectService } from './kobo-connect.service';

@Module({
  imports: [HttpModule],
  providers: [CustomHttpService, KoboConnectApiService, KoboConnectService],
  exports: [KoboConnectService],
})
export class KoboConnectModule {}
