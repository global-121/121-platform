import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { AuthMiddleware } from './auth.middleware';
import { DataStorageModule } from '../data-storage/data-storage.module';
import { DataStorageEntity } from '../data-storage/data-storage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataStorageEntity, UserEntity]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user', method: RequestMethod.GET },
        { path: 'user/delete', method: RequestMethod.POST },
        { path: 'user/change-password', method: RequestMethod.POST },
      );
  }
}
