import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AppDataSource } from '@121-service/src/appdatasource';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        await AppDataSource.initialize();
        return AppDataSource;
      },
    },
  ],
  exports: [DataSource],
})
export class TypeOrmModule {}
