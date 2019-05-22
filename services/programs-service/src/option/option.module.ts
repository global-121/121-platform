import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriumModule } from '../criterium/criterium.module';
import { OptionService } from './option.service';
import { OptionEntity } from './option.entity';
import { OptionController } from './option.controller';
import { AuthMiddleware } from '../user/auth.middleware';
import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';

@Module({
  imports: [TypeOrmModule.forFeature([OptionEntity]), CriteriumModule],
  providers: [OptionService],
  controllers: [
    OptionController
  ],
  exports: []
})
export class OptionModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
        {path: 'criterium-options/:criteriumId', method: RequestMethod.POST}
      );
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        {path: 'criterium-options', method: RequestMethod.GET}
      );
  }
}
