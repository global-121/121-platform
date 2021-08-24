import { Module, HttpModule } from '@nestjs/common';
import { ActionController } from './action.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { ActionEntity } from './action.entity';
import { ActionService } from './action.service';
import { UserModule } from '../user/user.module';

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
