import { Module, HttpModule } from '@nestjs/common';
import { InstanceController } from './instance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { InstanceEntity } from './instance.entity';
import { InstanceService } from './instance.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramEntity, UserEntity, InstanceEntity]),
    UserModule,
    HttpModule,
  ],
  providers: [InstanceService],
  controllers: [InstanceController],
  exports: [InstanceService],
})
export class InstanceModule {}
