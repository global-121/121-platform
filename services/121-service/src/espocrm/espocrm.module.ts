import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsModule } from '../registration/registrations.module';
import { AzureLoggerMiddleware } from '../shared/middleware/azure-logger.middleware';
import { UserModule } from '../user/user.module';
import { EspocrmWebhookEntity } from './espocrm-webhooks.entity';
import { EspocrmController } from './espocrm.controller';
import { EspocrmService } from './espocrm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EspocrmWebhookEntity]),
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
