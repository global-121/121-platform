import {
  FinancialServiceProviderConfigurationEnum,
  FinancialServiceProviderName,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '@121-service/src/notifications/enum/program-notification.enum';
import { MessageProcessType } from '@121-service/src/notifications/message-job.dto';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { IntersolveVoucherApiService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/instersolve-voucher.api.service';
import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

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
  @InjectRepository(ProgramFinancialServiceProviderConfigurationEntity)
  public programFspConfigurationRepository: Repository<ProgramFinancialServiceProviderConfigurationEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private readonly intersolveVoucherApiService: IntersolveVoucherApiService,
    private readonly queueMessageService: QueueMessageService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly registrationDataService: RegistrationDataService,
  ) {}

  public async cacheUnusedVouchers(): Promise<void> {
    const programs = await this.programRepository.find();
    for (const program of programs) {
      await this.intersolveVoucherService.updateUnusedVouchers(program.id);
    }
  }

  public async cancelByRefposIntersolve(): Promise<void> {
    const tenMinutes = 10 * 60 * 1000;
    const tenMinutesAgo = new Date(Date.now() - tenMinutes);

    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = new Date(Date.now() - twoWeeks);

    const failedIntersolveRquests =
      await this.intersolveVoucherRequestRepository.find({
        where: {
          updated: Between(twoWeeksAgo, tenMinutesAgo),
          toCancel: true,
        },
      });

    const config = await this.programFspConfigurationRepository
      .createQueryBuilder('fspConfig')
      .select('name')
      .addSelect('value')
      .andWhere('fsp.fsp = :fspName', {
        fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
      })
      .leftJoin('fspConfig.fsp', 'fsp')
      .getRawMany();

    // Instance has no intersolve voucher configuration
    if (config.length === 0) {
      return;
    }

    const credentials: { username: string; password: string } = {
      username: config.find(
        (c) => c.name === FinancialServiceProviderConfigurationEnum.username,
      )?.value,
      password: config.find(
        (c) => c.name === FinancialServiceProviderConfigurationEnum.password,
      )?.value,
    };

    for (const intersolveRequest of failedIntersolveRquests) {
      await this.cancelRequestRefpos(
        intersolveRequest,
        credentials.username,
        credentials.password,
      );
    }
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

  public async sendWhatsappReminders(): Promise<void> {
    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = new Date(Date.now() - sixteenHours);
    const programs = await this.programRepository.find();
    for (const program of programs) {
      // Don't send more then 3 vouchers, so no vouchers of more than 2 payments ago
      const lastPayment = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('MAX(transaction.payment)', 'max')
        .where('transaction.programId = :programId', {
          programId: program.id,
        })
        .getRawOne();
      const minimumPayment = lastPayment ? lastPayment.max - 2 : 0;

      const unsentIntersolveVouchers = await this.intersolveVoucherRepository
        .createQueryBuilder('voucher')
        .select([
          'voucher.id as id',
          '"whatsappPhoneNumber"',
          'registration."referenceId" AS "referenceId"',
          'amount',
          '"reminderCount"',
        ])
        .leftJoin('voucher.image', 'image')
        .leftJoin('image.registration', 'registration')
        .where('send = false')
        .andWhere('voucher.created < :sixteenHoursAgo', {
          sixteenHoursAgo: sixteenHoursAgo,
        })
        .andWhere('"whatsappPhoneNumber" is not NULL')
        .andWhere('voucher.payment >= :minimumPayment', {
          minimumPayment: minimumPayment,
        })
        .andWhere('registration.programId = :programId', {
          programId: program.id,
        })
        .andWhere('voucher."reminderCount" < 3')
        .getRawMany();

      for (const unsentIntersolveVoucher of unsentIntersolveVouchers) {
        const referenceId = unsentIntersolveVoucher.referenceId;
        const registration = await this.registrationRepository.findOneOrFail({
          where: { referenceId: referenceId },
          relations: ['program'],
        });
        const fromNumber =
          await this.registrationDataService.getRegistrationDataValueByName(
            registration,
            CustomDataAttributes.whatsappPhoneNumber,
          );
        if (!fromNumber) {
          // This can represent the case where a PA was switched from AH-voucher-whatsapp to AH-voucher-paper. But also otherwise it makes no sense to continue.
          console.log(
            `Registration ${referenceId} has no current whatsappPhoneNumber to send reminder message to.`,
          );
          continue;
        }
        const language = await this.getLanguageForRegistration(referenceId);
        let whatsappPayment =
          await this.intersolveVoucherService.getNotificationText(
            registration.program,
            ProgramNotificationEnum.whatsappPayment,
            language,
          );
        whatsappPayment = whatsappPayment
          .split('[[amount]]')
          .join(unsentIntersolveVoucher.amount);

        await this.queueMessageService.addMessageToQueue({
          registration,
          message: whatsappPayment,
          messageContentType: MessageContentType.paymentReminder,
          messageProcessType:
            MessageProcessType.whatsappTemplateVoucherReminder,
        });
        const reminderVoucher =
          await this.intersolveVoucherRepository.findOneOrFail({
            where: { id: unsentIntersolveVoucher.id },
          });

        reminderVoucher.reminderCount =
          (reminderVoucher.reminderCount ?? 0) + 1;
        await this.intersolveVoucherRepository.save(reminderVoucher);
      }

      console.log(
        `sendWhatsappReminders: ${unsentIntersolveVouchers.length} unsent Intersolve vouchers for program: ${program.id}`,
      );
    }
  }

  private async getLanguageForRegistration(
    referenceId: string,
  ): Promise<string> {
    const registration = await this.registrationRepository.findOneBy({
      referenceId: referenceId,
    });

    if (registration && registration.preferredLanguage) {
      return registration.preferredLanguage;
    }
    return this.fallbackLanguage;
  }
}
