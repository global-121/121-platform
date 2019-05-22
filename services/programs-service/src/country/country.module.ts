import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { CountryService } from './country.service';
import { CountryEntity } from './country.entity';
import { CountryController } from './country.controller';
import { AuthMiddleware } from '../user/auth.middleware';
import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity]), UserModule],
  providers: [CountryService],
  controllers: [
    CountryController
  ],
  exports: []
})
export class CountryModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
          {path: 'countrys', method: RequestMethod.POST},
          {path: 'countrys/:countryId', method: RequestMethod.PUT},
          {path: 'countrys', method: RequestMethod.GET},
        );
    // consumer
    //   .apply(AuthMiddleware)
    //   .forRoutes();
  }
}
