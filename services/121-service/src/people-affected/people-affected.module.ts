import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { PeopleAffectedController } from './people-affected.controller';
import { PeopleAffectedService } from './people-affected.service';
import { PersonAffectedAppDataEntity } from './person-affected-app-data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PersonAffectedAppDataEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [PeopleAffectedService],
  controllers: [PeopleAffectedController],
  exports: [],
})
export class PeopleAffectedModule {}
