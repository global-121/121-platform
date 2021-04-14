import { LookupModule } from '../../notifications/lookup/lookup.module';
import { ConnectionEntity } from '../connection.entity';
import { UserModule } from '../../user/user.module';
import { Module, forwardRef, HttpModule } from '@nestjs/common';
import { ValidationDataService } from './validation-data.service';
import { ValidationDataController } from './validation-data.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../user/user.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { ValidationDataAttributesEntity } from './validation-attributes.entity';
import { ProgramModule } from '../../programs/program/program.module';
import { FspAttributeEntity } from '../../programs/fsp/fsp-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProgramEntity,
      ConnectionEntity,
      ValidationDataAttributesEntity,
      FspAttributeEntity,
    ]),
    forwardRef(() => ProgramModule),
    LookupModule,
    UserModule,
    HttpModule,
  ],
  providers: [ValidationDataService],
  controllers: [ValidationDataController],
  exports: [ValidationDataService],
})
export class ValidationDataModule {}
