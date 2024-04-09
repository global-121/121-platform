import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { ProgramEntity } from '../programs/program.entity';
import { PermissionEntity } from './permissions.entity';
import { UserRoleEntity } from './user-role.entity';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      ProgramEntity,
      ProgramAidworkerAssignmentEntity,
      PermissionEntity,
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
