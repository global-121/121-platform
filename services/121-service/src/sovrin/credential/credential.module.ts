import { ProgramService } from './../../programs/program/program.service';
import { CredentialEntity } from './credential.entity';
import { UserModule } from '../../user/user.module';
import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
  forwardRef,
  HttpModule,
} from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../user/user.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { CredentialRequestEntity } from './credential-request.entity';
import { ProgramModule } from '../../programs/program/program.module';
import { AppointmentEntity } from '../../schedule/appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProgramEntity,
      CredentialAttributesEntity,
      CredentialRequestEntity,
      CredentialEntity,
      AppointmentEntity,
    ]),
    forwardRef(() => ProgramModule),
    UserModule,
    HttpModule,
  ],
  providers: [CredentialService],
  controllers: [CredentialController],
  exports: [CredentialService],
})
export class CredentialModule {}
