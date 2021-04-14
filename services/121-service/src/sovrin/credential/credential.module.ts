import { LookupModule } from './../../notifications/lookup/lookup.module';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { UserModule } from '../../user/user.module';
import { Module, forwardRef, HttpModule } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../user/user.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { ProgramModule } from '../../programs/program/program.module';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProgramEntity,
      ConnectionEntity,
      CredentialAttributesEntity,
      FspAttributeEntity,
    ]),
    forwardRef(() => ProgramModule),
    LookupModule,
    UserModule,
    HttpModule,
  ],
  providers: [CredentialService],
  controllers: [CredentialController],
  exports: [CredentialService],
})
export class CredentialModule {}
