import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { MessageProcessType } from '@121-service/src/notifications/dto/message-job.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { IntersolveVoucherApiService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/instersolve-voucher.api.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationPreferredLanguageEnum } from '@121-service/src/shared/enum/registration-preferred-language.enum';

// TODO: Consider Refactoring this service as intersolve voucher is the only fsp with a cron-service.
// Also it makes sense a separation of concerns that an fsp specific service does not know it's called by a cronjob.
@Injectable()
export class IntersolveVoucherCronService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(IntersolveIssueVoucherRequestEntity)
  private readonly intersolveVoucherRequestRepository: Repository<IntersolveIssueVoucherRequestEntity>;
  @InjectRepository(IntersolveVoucherEntity)
  private readonly intersolveVoucherRepository: Repository<IntersolveVoucherEntity>;
  @InjectRepository(TransactionEntity)
  public transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  public programRepository: Repository<ProgramEntity>;

  private readonly fallbackRegistrationPreferredLanguage =
    RegistrationPreferredLanguageEnum.en;

  public constructor(
    private readonly intersolveVoucherApiService: IntersolveVoucherApiService,
    private readonly queueMessageService: MessageQueuesService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
  ) {}

  public async cancelByRefposIntersolve(): Promise<number> {
    const tenMinutes = 10 * 60 * 1000;
    const tenMinutesAgo = new Date(Date.now() - tenMinutes);

    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = new Date(Date.now() - twoWeeks);

    const failedIntersolveRequests =
      await this.intersolveVoucherRequestRepository.find({
        where: {
          updated: Between(twoWeeksAgo, tenMinutesAgo),
          toCancel: Equal(true),
        },
      });
    if (failedIntersolveRequests.length === 0) {
      return 0;
    }

    // Get the first intersolve programFspConfigurationId that has intersolveVoucherWhatsapp as FSP
    // TODO: store the programFspConfigurationId or the username and password in the intersolveRequest table so we know which credentials to use for the cancelation
    // Before the registration data/programFspConfiguration this problem already existed...
    const configId = await this.programFspConfigurationRepository.findOne({
      where: {
        fspName: Equal(Fsps.intersolveVoucherWhatsapp),
      },
      select: ['id'],
    });

    if (!configId) {
      return 0;
    }

    const usernamePassword =
      await this.programFspConfigurationRepository.getUsernamePasswordProperties(
        configId.id,
      );
    if (!usernamePassword.username || !usernamePassword.password) {
      throw new Error(
        'No username or password found for intersolveVoucherWhatsapp in this instance while trying to cancel by refpos',
      );
    }
    for (const intersolveRequest of failedIntersolveRequests) {
      await this.cancelRequestRefpos(
        intersolveRequest,
        usernamePassword.username,
        usernamePassword.password,
      );
    }
    return failedIntersolveRequests.length;
  }

  private async cancelRequestRefpos(
    intersolveRequest: IntersolveIssueVoucherRequestEntity,
    username: string,
    password: string,
  ): Promise<void> {
    intersolveRequest.cancellationAttempts =
      intersolveRequest.cancellationAttempts + 1;
    try {
      const cancelByRefPosResponse =
        await this.intersolveVoucherApiService.cancelTransactionByRefPos(
          intersolveRequest.refPos,
          username,
          password,
        );
      intersolveRequest.cancelByRefPosResultCode =
        cancelByRefPosResponse.resultCode;
    } catch (Error) {
      console.log('Error cancelling by refpos id', Error, intersolveRequest);
    }
  }

  public async sendWhatsappReminders(): Promise<number> {
    let totalWhatsappReminders = 0;
    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = new Date(Date.now() - sixteenHours);
    // We only want to send reminders for vouchers that are not older than 2 weeks
    const twoWeeks = 2 * 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = new Date(Date.now() - twoWeeks);

    const programs = await this.programRepository.find();
    for (const program of programs) {
      const unsentIntersolveVouchers = await this.intersolveVoucherRepository
        .createQueryBuilder('voucher')
        .select([
          'voucher.id as id',
          '"whatsappPhoneNumber"',
          'registration."referenceId" AS "referenceId"',
          '"reminderCount"',
          'voucher."userId" AS "userId"',
        ])
        .leftJoin('voucher.image', 'image')
        .leftJoin('image.registration', 'registration')
        .leftJoin('voucher.payment', 'payment')
        .where('send = false')
        .andWhere('payment.created < :sixteenHoursAgo', {
          sixteenHoursAgo,
        })
        .andWhere('payment.created > :twoWeeksAgo', {
          twoWeeksAgo,
        })
        .andWhere('"whatsappPhoneNumber" is not NULL')
        .andWhere('registration.programId = :programId', {
          programId: program.id,
        })
        .andWhere('voucher."reminderCount" < 3')
        .getRawMany();

      for (const unsentIntersolveVoucher of unsentIntersolveVouchers) {
        const referenceId = unsentIntersolveVoucher.referenceId;
        const registration = await this.registrationRepository.findOneOrFail({
          where: { referenceId: Equal(referenceId) },
          relations: ['program'],
        });
        const fromNumber =
          await this.registrationDataService.getRegistrationDataValueByName(
            registration,
            DefaultRegistrationDataAttributeNames.whatsappPhoneNumber,
          );
        if (!fromNumber) {
          // This can represent the case where a PA was switched from Intersolve-voucher-whatsApp to Intersolve-voucher-paper. But also otherwise it makes no sense to continue.
          console.log(
            `Registration ${referenceId} has no current whatsappPhoneNumber to send reminder message to.`,
          );
          continue;
        }
        const language = await this.getLanguageForRegistration(referenceId);
        const contentSid =
          await this.intersolveVoucherService.getNotificationContentSid({
            program: registration.program,
            type: ProgramNotificationEnum.whatsappPayment,
            language,
          });

        await this.queueMessageService.addMessageJob({
          registration,
          contentSid,
          messageContentType: MessageContentType.paymentReminder,
          messageProcessType:
            MessageProcessType.whatsappTemplateVoucherReminder,
          userId: unsentIntersolveVoucher.userId,
        });
        const reminderVoucher =
          await this.intersolveVoucherRepository.findOneOrFail({
            where: { id: Equal(unsentIntersolveVoucher.id) },
          });

        reminderVoucher.reminderCount =
          (reminderVoucher.reminderCount ?? 0) + 1;
        await this.intersolveVoucherRepository.save(reminderVoucher);

        totalWhatsappReminders++;
      }

      console.log(
        `sendWhatsappReminders: ${unsentIntersolveVouchers.length} unsent Intersolve vouchers for program: ${program.id}`,
      );
    }
    return totalWhatsappReminders;
  }

  private async getLanguageForRegistration(
    referenceId: string,
  ): Promise<string> {
    const registration = await this.registrationRepository.findOneBy({
      referenceId,
    });

    if (registration && registration.preferredLanguage) {
      return registration.preferredLanguage;
    }
    return this.fallbackRegistrationPreferredLanguage;
  }
}
