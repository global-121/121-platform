import { InstanceController } from '@121-service/src/instance/instance.controller';
import { InstanceEntity } from '@121-service/src/instance/instance.entity';
import { InstanceService } from '@121-service/src/instance/instance.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([InstanceEntity]), UserModule, HttpModule],
  providers: [InstanceService],
  controllers: [InstanceController],
  exports: [InstanceService],
})
export class InstanceModule {}
