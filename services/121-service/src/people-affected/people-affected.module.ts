import { PersonAffectedAppDataEntity } from './person-affected-app-data.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, HttpModule } from '@nestjs/common';
import { ActionEntity } from '../actions/action.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { PeopleAffectedController } from './people-affected.controller';
import { PeopleAffectedService } from './people-affected.service';

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
