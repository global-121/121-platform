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
import { AuthMiddlewareAW } from './auth.middlewareAW';
import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';
import { ProgramEntity } from '../programs/program/program.entity';
import { AuthMiddlewarePM } from './auth.middlewarePM';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ProgramEntity])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
        { path: 'user/:userId', method: RequestMethod.DELETE },
      );
    consumer
      .apply(AuthMiddlewarePM)
      .forRoutes(
        { path: 'user/:userId/deactivate', method: RequestMethod.PUT },
        { path: 'user/:userId/activate', method: RequestMethod.PUT },
        { path: 'user/:userId/:programId', method: RequestMethod.PUT },
      );
    consumer
      .apply(AuthMiddlewareAW)
      .forRoutes(
        { path: 'user', method: RequestMethod.GET },
        { path: 'user/change-password', method: RequestMethod.POST },
      );
  }
}
