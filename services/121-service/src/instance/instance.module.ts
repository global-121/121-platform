import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../programs/program.entity';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { InstanceController } from './instance.controller';
import { InstanceEntity } from './instance.entity';
import { InstanceService } from './instance.service';

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
