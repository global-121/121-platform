import { Module } from '@nestjs/common';
import { ResetController } from './reset.controller';

@Module({
  imports: [],
  controllers: [ResetController],
})
export class ResetModule {}
