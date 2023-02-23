import { Module } from '@nestjs/common';
import { EspoCrmController } from './espocrm.controller';

@Module({
  imports: [],
  controllers: [EspoCrmController],
  providers: [],
})
export class EspoCrmModule {}
