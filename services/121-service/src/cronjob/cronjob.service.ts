import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, LessThan, Repository, In, Between, Not } from 'typeorm';
import { IntersolveBarcodeEntity } from '../programs/fsp/intersolve-barcode.entity';
import { ProgramEntity } from '../programs/program/program.entity';
import { WhatsappService } from '../notifications/whatsapp/whatsapp.service';
import { IntersolveRequestEntity } from '../programs/fsp/intersolve-request.entity';
import { IntersolveApiService } from '../programs/fsp/api/instersolve.api.service';
import { ConnectionEntity } from '../sovrin/create-connection/connection.entity';

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

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  private async cronSendWhatsappReminders(): Promise<void> {
    console.log('Execution Started: cronSendWhatsappReminders');

    const programId = 1;
    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = (d =>
      new Date(d.setTime(d.getTime() - sixteenHours)))(new Date());

    const program = await getRepository(ProgramEntity).findOne(programId);
    const unsentIntersolveBarcodes = await this.intersolveBarcodeRepository.find(
      {
        where: { send: false, timestamp: LessThan(sixteenHoursAgo) },
      },
    );

    unsentIntersolveBarcodes.forEach(async unsentIntersolveBarcode => {
      const fromNumber = unsentIntersolveBarcode.whatsappPhoneNumber;
      const language = (await this.connectionRepository.find()).filter(
        c => c.customData['whatsappPhoneNumber'] === fromNumber,
      )[0].preferredLanguage;
      const whatsappPayment =
        program.notifications[language]['whatsappPayment'];

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

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed.
    // and tries to cancel the
    console.log('Execution Started: cancelByRefposIntersolve');

    const tenMinutes = 10 * 60 * 1000;
    const tenMinutesAgo = (d => new Date(d.setTime(d.getTime() - tenMinutes)))(
      new Date(),
    );

    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = (d => new Date(d.setTime(d.getTime() - twoWeeks)))(
      new Date(),
    );
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
