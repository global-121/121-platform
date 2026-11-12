import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOneTimePasswordEntity } from '@121-service/src/user/user-one-time-password/user-one-time-password.entity';
import { UserOneTimePasswordRepository } from '@121-service/src/user/user-one-time-password/user-one-time-password.repository';
import { UserOneTimePasswordsService } from '@121-service/src/user/user-one-time-password/user-one-time-passwords.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOneTimePasswordEntity])],
  providers: [UserOneTimePasswordsService, UserOneTimePasswordRepository],
  exports: [UserOneTimePasswordsService],
})
export class UserOneTimePasswordsModule {}
