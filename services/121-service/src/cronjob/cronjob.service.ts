import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, LessThan, Repository } from 'typeorm';
import { IntersolveBarcodeEntity } from '../programs/fsp/intersolve-barcode.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { WhatsappService } from '../notifications/whatsapp/whatsapp.service';

@Injectable()
export class CronjobService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;

  public constructor(private whatsappService: WhatsappService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  private async cronSendWhatsappReminders(): Promise<void> {
    console.log('Execution Started: cronSendWhatsappReminders');

    const programId = 1;
    const language = 'en';
    const yesterday = (d => new Date(d.setDate(d.getDate() - 1)))(new Date());

    const program = await getRepository(ProgramEntity).findOne(programId);
    const unsentIntersolveBarcodes = await this.intersolveBarcodeRepository.find(
      {
        where: { send: false, timestamp: LessThan(yesterday) },
      },
    );

    unsentIntersolveBarcodes.forEach(async unsentIntersolveBarcode => {
      const whatsappPayment =
        program.notifications[language]['whatsappPayment'];
      const fromNumber = unsentIntersolveBarcode.whatsappPhoneNumber;
      await this.whatsappService.sendWhatsapp(
        whatsappPayment,
        fromNumber,
        null,
      );
    });

    console.log(
      `cronSendWhatsappReminders: ${unsentIntersolveBarcodes.length} unsent Intersolve barcodes`,
    );
    console.log('Execution Complete: cronSendWhatsappReminders');
  }
}
