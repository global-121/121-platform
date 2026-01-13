import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ApproverEntity } from '@121-service/src/user/approver/entities/approver.entity';
import { RolesController } from '@121-service/src/user/controllers/roles.controller';
import { UserController } from '@121-service/src/user/controllers/user.controller';
import { UserAssignmentsController } from '@121-service/src/user/controllers/user-assignments.controller';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { UserService } from '@121-service/src/user/user.service';
import { UserEmailsModule } from '@121-service/src/user/user-emails/user-emails.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      ProgramEntity,
      ProgramAidworkerAssignmentEntity,
      PermissionEntity,
      ApproverEntity,
    ]),
    UserEmailsModule,
  ],
  providers: [UserService],
  controllers: [UserController, UserAssignmentsController, RolesController],
  exports: [UserService],
})
export class UserModule {}
