import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsController } from '@121-service/src/actions/actions.controller';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserModule } from '@121-service/src/user/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
