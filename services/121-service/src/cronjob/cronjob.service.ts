import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { MessageContentType } from '../notifications/message-type.enum';
import { WhatsappService } from '../notifications/whatsapp/whatsapp.service';
import { IntersolveVisaWalletEntity } from '../payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { IntersolveVisaApiService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { IntersolveVisaService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherPayoutStatus } from '../payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { IntersolveVoucherApiService } from '../payments/fsp-integration/intersolve-voucher/instersolve-voucher.api.service';
import { IntersolveIssueVoucherRequestEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherService } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramFspConfigurationEntity } from '../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../programs/program.entity';
import { CustomDataAttributes } from '../registration/enum/custom-data-attributes';
import { RegistrationEntity } from '../registration/registration.entity';

@Injectable()
export class CronjobService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(IntersolveIssueVoucherRequestEntity)
  private readonly intersolveVoucherRequestRepo: Repository<IntersolveIssueVoucherRequestEntity>;
  @InjectRepository(ProgramFspConfigurationEntity)
  public programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;
  @InjectRepository(IntersolveVisaWalletEntity)
  public intersolveVisaWalletRepository: Repository<IntersolveVisaWalletEntity>;

  private readonly fallbackLanguage = 'en';

  public constructor(
    private whatsappService: WhatsappService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly dataSource: DataSource,
    private readonly intersolveVoucherApiService: IntersolveVoucherApiService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly intersolveVisaApiService: IntersolveVisaApiService,
  ) {}

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

  private getNotificationText(
    program: ProgramEntity,
    type: string,
    language?: string,
  ): string {
    if (
      program.notifications[language] &&
      program.notifications[language][type]
    ) {
      return program.notifications[language][type];
    }
    return program.notifications[this.fallbackLanguage][type];
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  private async cacheUnusedVouchers(): Promise<void> {
    const programs = await this.programRepository.find();
    for (const program of programs) {
      this.intersolveVoucherService.getUnusedVouchers(program.id);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  private async cronSendWhatsappReminders(): Promise<void> {
    console.log('CronjobService - Started: cronSendWhatsappReminders');
    const sixteenHours = 16 * 60 * 60 * 1000;
    const sixteenHoursAgo = new Date(Date.now() - sixteenHours);
    const programs = await this.programRepository.find();
    for (const program of programs) {
      const intersolveVoucherRepository = this.dataSource.getRepository(
        IntersolveVoucherEntity,
      );
      // Don't send more then 3 vouchers, so no vouchers of more than 2 payments ago
      const lastPayment = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('MAX(transaction.payment)', 'max')
        .where('transaction.programId = :programId', {
          programId: program.id,
        })
        .getRawOne();
      const minimumPayment = lastPayment ? lastPayment.max - 2 : 0;

      const unsentIntersolveVouchers = await intersolveVoucherRepository
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
        const registration = await this.registrationRepository.findOne({
          where: { referenceId: referenceId },
          relations: ['program'],
        });
        const fromNumber = await registration.getRegistrationDataValueByName(
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
        let whatsappPayment = this.getNotificationText(
          registration.program,
          'whatsappPayment',
          language,
        );
        whatsappPayment = whatsappPayment
          .split('{{1}}')
          .join(unsentIntersolveVoucher.amount);

        await this.whatsappService.sendWhatsapp(
          whatsappPayment,
          fromNumber,
          IntersolveVoucherPayoutStatus.InitialMessage,
          null,
          registration.id,
          MessageContentType.paymentReminder,
        );
        const reminderVoucher = await intersolveVoucherRepository.findOne({
          where: { id: unsentIntersolveVoucher.id },
        });

        reminderVoucher.reminderCount += 1;
        intersolveVoucherRepository.save(reminderVoucher);
      }

      console.log(
        `cronSendWhatsappReminders: ${unsentIntersolveVouchers.length} unsent Intersolve vouchers for program: ${program.id}`,
      );
    }
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

    const failedIntersolveRquests =
      await this.intersolveVoucherRequestRepo.find({
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
        fspName: FspName.intersolveVoucherWhatsapp,
      })
      .leftJoin('fspConfig.fsp', 'fsp')
      .getRawMany();

    const credentials: { username: string; password: string } = {
      username: config.find((c) => c.name === 'username')?.value,
      password: config.find((c) => c.name === 'password')?.value,
    };

    for (const intersolveRequest of failedIntersolveRquests) {
      this.cancelRequestRefpos(
        intersolveRequest,
        credentials.username,
        credentials.password,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  public async updateVisaDebitWalletDetailsCron(): Promise<void> {
    console.log('CronjobService - Started: updateVisaDebitWalletDetailsCron');
    // NOTE: This currently happens for all the Visa Wallets across programs/instances
    const wallets = await this.intersolveVisaWalletRepository
      .createQueryBuilder('wallet')
      .select('wallet.id as id')
      .addSelect('wallet."tokenCode" as "tokenCode"')
      .addSelect('wallet."lastUsedDate" as "lastUsedDate"')
      .getRawMany();
    for (const wallet of wallets) {
      const details = await this.intersolveVisaApiService.getWallet(
        wallet.tokenCode,
      );
      const lastUsedDate =
        await this.intersolveVisaService.getLastChargeTransactionDate(
          wallet.tokenCode,
          wallet.lastUsedDate,
        );
      wallet.balance = details.data.data.balances.find(
        (b) => b.quantity.assetCode === process.env.INTERSOLVE_VISA_ASSET_CODE,
      ).quantity.value;
      wallet.status = details.data.data.status;
      wallet.lastUsedDate = lastUsedDate;
      this.intersolveVisaWalletRepository
        .update({ id: wallet.id }, wallet)
        .catch((e) => {
          console.error(e);
        });
    }
    console.log('CronjobService - Finished: updateVisaDebitWalletDetailsCron');
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
}
