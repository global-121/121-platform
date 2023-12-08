import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { RegistrationEntity } from '../../registration.entity';
import { RegistrationChangeLogController } from './registration-change-log.controller';
import { RegistrationChangeLogEntity } from './registration-change-log.entity';
import { RegistrationChangeLogService } from './registration-change-log.service';
import { createScopedRepositoryProvider } from '../../../utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RegistrationEntity,
      RegistrationChangeLogEntity,
    ]),
    UserModule,
  ],
  providers: [
    RegistrationChangeLogService,
    createScopedRepositoryProvider(RegistrationChangeLogEntity),
  ],
  controllers: [RegistrationChangeLogController],
  exports: [RegistrationChangeLogService],
})
export class RegistrationChangeLogModule {}
