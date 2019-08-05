import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateConnectionService } from './create-connection.service';
import { CreateConnectionController } from './create-connection.controller';
import { ConnectionEntity } from './connection.entity';
import { AuthMiddlewareAdmin } from '../../user/auth.middlewareAdmin';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectionEntity]),UserModule
  ],
  providers: [CreateConnectionService],
  controllers: [CreateConnectionController],
})
export class CreateConnectionModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddlewareAdmin).forRoutes(
      { path: 'create-connection/all', method: RequestMethod.POST}
    );
  }
}
