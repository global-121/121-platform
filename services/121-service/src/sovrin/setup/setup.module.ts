import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SovrinSetupService } from './setup.service';
import { SovrinSetupController } from './setup.controller';
import { AuthMiddlewareAdmin } from '../../user/auth.middlewareAdmin';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([]),UserModule
  ],
  providers: [SovrinSetupService],
  controllers: [SovrinSetupController],
})
export class SovrinSetupModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddlewareAdmin).forRoutes(
      { path: 'create-connection/all', method: RequestMethod.POST}
    );
  }
}
