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
import { UserEntity } from '../../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity, UserEntity]), UserModule],
  providers: [CountryService],
  controllers: [CountryController],
  exports: [],
})
export class CountryModule {}
