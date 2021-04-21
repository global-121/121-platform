import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository, Between } from 'typeorm';
import { IntersolveBarcodeEntity } from '../programs/fsp/intersolve-barcode.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { WhatsappService } from '../notifications/whatsapp/whatsapp.service';
import { IntersolveRequestEntity } from '../programs/fsp/intersolve-request.entity';
import { IntersolveApiService } from '../programs/fsp/api/instersolve.api.service';
import { ConnectionEntity } from '../connection/connection.entity';

@Injectable()
export class CronjobService {
  @InjectRepository(IntersolveBarcodeEntity)
  private readonly intersolveBarcodeRepository: Repository<
    IntersolveBarcodeEntity
  >;
  @InjectRepository(IntersolveRequestEntity)
  private readonly intersolveRequestRepository: Repository<
    IntersolveRequestEntity
  >;
  @InjectRepository(ConnectionEntity)
  private readonly connectionRepository: Repository<ConnectionEntity>;

  public constructor(
    private whatsappService: WhatsappService,
    private readonly intersolveApiService: IntersolveApiService,
  ) {}

  private async getLanguageForConnection(referenceId: string): Promise<string> {
    const fallbackLanguage = 'en';

    const connection = await this.connectionRepository.findOne({
      referenceId: referenceId,
    });

    if (connection && connection.preferredLanguage) {
      return connection.preferredLanguage;
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

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  private async cronSendWhatsappReminders(): Promise<void> {
    console.log('CronjobService - Started: cronSendWhatsappReminders');

    const programId = 1;
    const program = await getRepository(ProgramEntity).findOne(programId);

    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = new Date(Date.now() - sixteenHours);

    const unsentIntersolveBarcodes = await getRepository(
      IntersolveBarcodeEntity,
    )
      .createQueryBuilder('barcode')
      .select([
        '"whatsappPhoneNumber"',
        'connection."referenceId" AS "referenceId"',
      ])
      .leftJoin('barcode.image', 'image')
      .leftJoin('image.connection', 'connection')
      .where('send = false')
      .andWhere('timestamp < :sixteenHoursAgo', {
        sixteenHoursAgo: sixteenHoursAgo,
      })
      .getRawMany();

    unsentIntersolveBarcodes.forEach(async unsentIntersolveBarcode => {
      const fromNumber = unsentIntersolveBarcode.whatsappPhoneNumber;
      const referenceId = unsentIntersolveBarcode.referenceId;
      const language = await this.getLanguageForConnection(referenceId);
      const whatsappPayment = this.getNotificationText(
        program,
        'whatsappPayment',
        language,
      );

      await this.whatsappService.sendWhatsapp(
        whatsappPayment,
        fromNumber,
        null,
      );
    });

    console.log(
      `cronSendWhatsappReminders: ${unsentIntersolveBarcodes.length} unsent Intersolve barcodes`,
    );
    console.log('CronjobService - Complete: cronSendWhatsappReminders');
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed.
    // and tries to cancel the
    console.log('CronjobService - Started: cancelByRefposIntersolve');

    const tenMinutes = 10 * 60 * 1000;
    const tenMinutesAgo = new Date(Date.now() - tenMinutes);

    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = new Date(Date.now() - twoWeeks);

    const failedIntersolveRquests = await this.intersolveRequestRepository.find(
      {
        where: {
          updated: Between(twoWeeksAgo, tenMinutesAgo),
          toCancel: true,
        },
      },
    );
    for (let intersolveRequest of failedIntersolveRquests) {
      this.cancelRequestRefpos(intersolveRequest);
    }
  }

  private async cancelRequestRefpos(
    intersolveRequest: IntersolveRequestEntity,
  ): Promise<void> {
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    try {
      const cancelByRefPosResponse = await this.intersolveApiService.cancelTransactionByRefPos(
        intersolveRequest.refPos,
      );
      intersolveRequest.cancelByRefPosResultCode =
        cancelByRefPosResponse.resultCode;
    } catch (Error) {
      console.log('Error cancelling by refpos id', Error, intersolveRequest);
    }
  }
}
