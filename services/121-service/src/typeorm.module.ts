import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../appdatasource';

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
