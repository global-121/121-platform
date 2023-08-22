import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsModule } from '../registration/registrations.module';
import { AzureLoggerMiddleware } from '../shared/middleware/azure-logger.middleware';
import { UserEntity } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { EspocrmWebhookEntity } from './espocrm-webhooks.entity';
import { EspocrmController } from './espocrm.controller';
import { EspocrmService } from './espocrm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EspocrmWebhookEntity, UserEntity]),
    RegistrationsModule,
    UserModule,
  ],
  controllers: [EspocrmController],
  providers: [EspocrmService],
})
export class EspocrmModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(EspocrmController);
  }
}
