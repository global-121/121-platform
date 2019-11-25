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
import { AuthMiddleware } from '../user/auth.middleware';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataStorageEntity, UserEntity]),
    UserModule
  ],
  providers: [DataStorageService],
  controllers: [DataStorageController],
  exports: [DataStorageService],
})
export class DataStorageModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'data-storage/:type', method: RequestMethod.GET },
        { path: 'data-storage', method: RequestMethod.POST },
      );
  }
}
