import { ResetController } from '@mock-service/src/reset/reset.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [ResetController],
})
export class ResetModule {}
