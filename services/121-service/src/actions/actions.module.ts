import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsController } from '@121-service/src/actions/actions.controller';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { ProjectEntity } from '@121-service/src/projects/entities/project.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, UserEntity, ActionEntity]),
    UserModule,
  ],
  providers: [ActionsService],
  controllers: [ActionsController],
  exports: [ActionsService],
})
export class ActionsModule {}
