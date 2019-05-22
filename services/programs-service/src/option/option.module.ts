import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteriumModule } from '../criterium/criterium.module';
import { OptionService } from './option.service';
import { OptionEntity } from './option.entity';
import { OptionController } from './option.controller';

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
  }
}
