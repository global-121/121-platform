import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOneTimePasswordEntity } from '@121-service/src/user/user-one-time-password/user-one-time-password.entity';
import { UserOneTimePasswordRepository } from '@121-service/src/user/user-one-time-password/user-one-time-password.repository';
import { UserOneTimePasswordService } from '@121-service/src/user/user-one-time-password/user-one-time-password.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOneTimePasswordEntity])],
  providers: [UserOneTimePasswordService, UserOneTimePasswordRepository],
  exports: [UserOneTimePasswordService],
})
export class UserOneTimePasswordModule {}
