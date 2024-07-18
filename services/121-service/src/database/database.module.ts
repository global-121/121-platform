import { UnitOfWork } from '@121-service/src/database/unit-of-work.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [UnitOfWork],
  exports: [UnitOfWork],
})
export class DatabaseModule {}
