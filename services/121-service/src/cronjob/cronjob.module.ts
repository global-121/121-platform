import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { CronjobService } from './cronjob.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CreateConnectionModule } from '../sovrin/create-connection/create-connection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectionEntity]),
    CreateConnectionModule,
  ],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
