import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { PermissionEntity } from '@121-service/src/user/permissions.entity';
import { UserController } from '@121-service/src/user/user.controller';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserService } from '@121-service/src/user/user.service';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      ProgramEntity,
      ProgramAidworkerAssignmentEntity,
      PermissionEntity,
    ]),
    EmailsModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
