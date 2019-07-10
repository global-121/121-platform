import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { CountryModule } from '../country/country.module';
import { StandardCriteriumService } from './standard-criterium.service';
import { StandardCriteriumEntity } from './standard-criterium.entity';
import { StandardCriteriumController } from './standard-criterium.controller';
import { AuthMiddleware } from '../user/auth.middleware';
import { AuthMiddlewareAdmin } from '../user/auth.middlewareAdmin';
import { UserEntity } from '../user/user.entity';
import { CountryEntity } from '../country/country.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StandardCriteriumEntity,
      UserEntity,
      CountryEntity,
    ]),
    UserModule,
    CountryModule,
  ],
  providers: [StandardCriteriumService],
  controllers: [StandardCriteriumController],
  exports: [],
})
export class StandardCriteriumModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddlewareAdmin)
      .forRoutes({ path: 'criteriums', method: RequestMethod.POST });
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'standard-criteriums', method: RequestMethod.GET },
        { path: 'standard-criteriums/:countryId', method: RequestMethod.GET },
      );
  }
}
