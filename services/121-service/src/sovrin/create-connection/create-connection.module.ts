import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateConnectionService } from './create-connection.service';
import { CreateConnectionController } from './create-connection.controller';
import { ConnectionEntity } from './connection.entity';
import { UserModule } from '../../user/user.module';
import { CredentialAttributesEntity } from '../credential/credential-attributes.entity';
import { CredentialRequestEntity } from '../credential/credential-request.entity';
import { CredentialEntity } from '../credential/credential.entity';
import { FinancialServiceProviderEntity } from '../../programs/fsp/financial-service-provider.entity';
import { ProgramModule } from '../../programs/program/program.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConnectionEntity,
      CredentialAttributesEntity,
      CredentialRequestEntity,
      CredentialEntity,
      FinancialServiceProviderEntity,
    ]),
    ProgramModule,
    UserModule,
    HttpModule,
  ],
  providers: [CreateConnectionService],
  controllers: [CreateConnectionController],
  exports: [CreateConnectionService],
})
export class CreateConnectionModule {}
