import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../user/user.module';
import { CountryService } from './country.service';
import { CountryEntity } from './country.entity';
import { CountryController } from './country.controller';
import { AuthMiddlewareAdmin } from '../../user/auth.middlewareAdmin';
import { UserEntity } from '../../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity, UserEntity]), UserModule],
  providers: [CountryService],
  controllers: [CountryController],
  exports: [],
})
export class CountryModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes(
        { path: 'countrys', method: RequestMethod.POST },
        { path: 'countrys/:countryId', method: RequestMethod.PUT },
        { path: 'countrys', method: RequestMethod.GET },
      );
  }
}
