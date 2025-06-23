import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { FspsController } from '@121-service/src/fsps/fsp.controller';
import { FspsService } from '@121-service/src/fsps/fsp.service';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [HttpModule, UserModule],
  providers: [FspsService],
  controllers: [FspsController],
  exports: [FspsService],
})
export class FspsModule {}
