import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, UserEntity, ActionEntity]),
    UserModule,
  ],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
