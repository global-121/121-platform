import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { ProgramEntity } from '../programs/program.entity';
import { UserRoleEntity } from './user-role.entity';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { PersonAffectedAppDataEntity } from '../people-affected/person-affected-app-data.entity';
import { PermissionEntity } from './permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      ProgramEntity,
      ProgramAidworkerAssignmentEntity,
      PersonAffectedAppDataEntity,
      RegistrationEntity,
      TransactionEntity,
      PermissionEntity,
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
