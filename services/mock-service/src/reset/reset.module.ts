import { Module } from '@nestjs/common';

import { ResetController } from '@mock-service/src/reset/reset.controller';

@Module({
  imports: [],
  controllers: [ResetController],
})
export class ResetModule {}
