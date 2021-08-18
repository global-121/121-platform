import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserRoleEntity } from './user-role.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program/program-aidworker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      ProgramEntity,
      ProgramAidworkerAssignmentEntity,
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
