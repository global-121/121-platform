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
import { AuthMiddleware } from '../user/auth.middleware';
import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';
import { ProgramEntity } from '../program/program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ProgramEntity])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
        { path: 'user/:userId', method: RequestMethod.DELETE },
        { path: 'user/:userId/deactivate', method: RequestMethod.PUT },
        { path: 'user/:userId/activate', method: RequestMethod.PUT },
      );
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user', method: RequestMethod.GET },
        { path: 'user/change-password', method: RequestMethod.POST },
      );
  }
}
