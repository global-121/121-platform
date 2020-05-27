import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { DataStorageController } from './data-storage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataStorageEntity } from './data-storage.entity';
import { UserEntity } from '../user/user.entity';
import { DataStorageService } from './data-storage.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataStorageEntity, UserEntity]),
    UserModule,
  ],
  providers: [DataStorageService],
  controllers: [DataStorageController],
  exports: [DataStorageService],
})
export class DataStorageModule {}
