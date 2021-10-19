import { RegistrationEntity } from './../registration/registration.entity';
import { CronjobService } from './cronjob.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { IntersolveBarcodeEntity } from '../payments/intersolve/intersolve-barcode.entity';
import { ProgramEntity } from '../programs/program.entity';
import { WhatsappModule } from '../notifications/whatsapp/whatsapp.module';
import { IntersolveRequestEntity } from '../payments/intersolve/intersolve-request.entity';
import { IntersolveModule } from '../payments/intersolve/intersolve.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntersolveBarcodeEntity,
      ProgramEntity,
      IntersolveRequestEntity,
      RegistrationEntity,
    ]),
    WhatsappModule,
    IntersolveModule,
  ],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
