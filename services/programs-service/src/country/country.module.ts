import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { CountryService } from './country.service';
import { CountryEntity } from './country.entity';
import { CountryController } from './country.controller';

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
  }
}
