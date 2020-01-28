import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../user/user.module';
import { CountryModule } from '../country/country.module';
import { StandardCriteriumService } from './standard-criterium.service';
import { StandardCriteriumEntity } from './standard-criterium.entity';
import { StandardCriteriumController } from './standard-criterium.controller';
import { UserEntity } from '../../user/user.entity';
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
export class StandardCriteriumModule {}
