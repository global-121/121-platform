import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { DataStorageEntity } from '../data-storage/data-storage.entity';
import { DataStorageService } from '../data-storage/data-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataStorageEntity, UserEntity])],
  providers: [UserService, DataStorageService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
