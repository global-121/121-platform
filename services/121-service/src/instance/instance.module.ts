import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { InstanceController } from './instance.controller';
import { InstanceEntity } from './instance.entity';
import { InstanceService } from './instance.service';

@Module({
  imports: [TypeOrmModule.forFeature([InstanceEntity]), UserModule, HttpModule],
  providers: [InstanceService],
  controllers: [InstanceController],
  exports: [InstanceService],
})
export class InstanceModule {}
