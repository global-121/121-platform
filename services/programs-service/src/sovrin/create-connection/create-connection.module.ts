import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { CreateConnectionService } from './create-connection.service';
import { CreateConnectionController } from './create-connection.controller';

@Module({
  imports: [],
  providers: [CreateConnectionService],
  controllers: [CreateConnectionController],
})
export class CreateConnectionModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply().forRoutes({
      path: 'create-connection',
      method: RequestMethod.POST,
    });
    consumer.apply().forRoutes({
      path: 'create-connection',
      method: RequestMethod.POST,
    });
  }
}
