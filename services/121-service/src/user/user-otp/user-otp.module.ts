import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOtpEntity } from '@121-service/src/user/user-otp/user-otp.entity';
import { UserOtpRepository } from '@121-service/src/user/user-otp/user-otp.repository';
import { UserOtpService } from '@121-service/src/user/user-otp/user-otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOtpEntity])],
  providers: [UserOtpService, UserOtpRepository],
  exports: [UserOtpService],
})
export class UserOtpModule {}
