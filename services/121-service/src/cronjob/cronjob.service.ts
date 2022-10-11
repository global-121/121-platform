import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, Between } from 'typeorm';
import { WhatsappService } from '../notifications/whatsapp/whatsapp.service';
import { IntersolvePayoutStatus } from '../payments/fsp-integration/intersolve/enum/intersolve-payout-status.enum';
import { IntersolveApiService } from '../payments/fsp-integration/intersolve/instersolve.api.service';
import { IntersolveBarcodeEntity } from '../payments/fsp-integration/intersolve/intersolve-barcode.entity';
import { IntersolveRequestEntity } from '../payments/fsp-integration/intersolve/intersolve-request.entity';
import { IntersolveService } from '../payments/fsp-integration/intersolve/intersolve.service';
import { ProgramEntity } from '../programs/program.entity';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../registration/registration.entity';

@Injectable()
export class CronjobService {
  @InjectRepository(IntersolveRequestEntity)
  private readonly intersolveRequestRepository: Repository<
    IntersolveRequestEntity
  >;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public constructor(
    private whatsappService: WhatsappService,
    private readonly intersolveApiService: IntersolveApiService,
    private readonly intersolveService: IntersolveService,
  ) {}

  private async getLanguageForRegistration(
    referenceId: string,
  ): Promise<string> {
    const fallbackLanguage = 'en';

    const registration = await this.registrationRepository.findOne({
      referenceId: referenceId,
    });

    if (registration && registration.preferredLanguage) {
      return registration.preferredLanguage;
    }
    return fallbackLanguage;
  }

  private getNotificationText(
    program: ProgramEntity,
    type: string,
    language?: string,
  ): string {
    const fallbackLanguage = 'en';

    if (
      program.notifications[language] &&
      program.notifications[language][type]
    ) {
      return program.notifications[language][type];
    }
    return program.notifications[fallbackLanguage][type];
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  private async cacheUnusedVouchers(): Promise<void> {
    this.intersolveService.getUnusedVouchers();
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  private async cronSendWhatsappReminders(): Promise<void> {
    console.log('CronjobService - Started: cronSendWhatsappReminders');
    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = new Date(Date.now() - sixteenHours);

    const unsentIntersolveBarcodes = await getRepository(
      IntersolveBarcodeEntity,
    )
      .createQueryBuilder('barcode')
      .select([
        '"whatsappPhoneNumber"',
        'registration."referenceId" AS "referenceId"',
        'amount',
      ])
      .leftJoin('barcode.image', 'image')
      .leftJoin('image.registration', 'registration')
      .where('send = false')
      .andWhere('barcode.created < :sixteenHoursAgo', {
        sixteenHoursAgo: sixteenHoursAgo,
      })
      .andWhere('"whatsappPhoneNumber" is not NULL')
      .getRawMany();

    unsentIntersolveBarcodes.forEach(async unsentIntersolveBarcode => {
      const referenceId = unsentIntersolveBarcode.referenceId;
      const registration = await this.registrationRepository.findOne({
        where: { referenceId: referenceId },
        relations: ['program'],
      });
      const fromNumber = await registration.getRegistrationDataValueByName(
        CustomDataAttributes.whatsappPhoneNumber,
      );
      const language = await this.getLanguageForRegistration(referenceId);
      let whatsappPayment = this.getNotificationText(
        registration.program,
        'whatsappPayment',
        language,
      );
      whatsappPayment = whatsappPayment
        .split('{{1}}')
        .join(unsentIntersolveBarcode.amount);

      await this.whatsappService.sendWhatsapp(
        whatsappPayment,
        fromNumber,
        IntersolvePayoutStatus.InitialMessage,
        null,
        registration.id,
      );
    });

    console.log(
      `cronSendWhatsappReminders: ${unsentIntersolveBarcodes.length} unsent Intersolve barcodes`,
    );
    console.log('CronjobService - Complete: cronSendWhatsappReminders');
  }
}
