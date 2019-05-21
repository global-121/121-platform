import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { CountryModule } from '../country/country.module';
import { CriteriumService } from './criterium.service';
import { CriteriumEntity } from './criterium.entity';
import { CriteriumController } from './criterium.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CriteriumEntity]), UserModule, CountryModule],
  providers: [CriteriumService],
  controllers: [
    CriteriumController
  ],
  exports: []
})
export class CriteriumModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
  }
}
