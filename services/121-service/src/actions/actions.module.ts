import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { ActionsController } from './actions.controller';
import { ActionEntity } from './action.entity';
import { ActionsService } from './actions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, UserEntity, ActionEntity]),
    UserModule,
  ],
  providers: [ActionsService],
  controllers: [ActionsController],
  exports: [ActionsService],
})
export class ActionsModule {}
