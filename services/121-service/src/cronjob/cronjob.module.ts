import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';
import { CronjobService } from './cronjob.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { IntersolveBarcodeEntity } from '../programs/fsp/intersolve-barcode.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { WhatsappModule } from '../notifications/whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntersolveBarcodeEntity, ProgramEntity]),
    WhatsappModule,
  ],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
