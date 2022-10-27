import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { ActionController } from './action.controller';
import { ActionEntity } from './action.entity';
import { ActionService } from './action.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, UserEntity, ActionEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [ActionService],
  controllers: [ActionController],
  exports: [ActionService],
})
export class ActionModule {}
