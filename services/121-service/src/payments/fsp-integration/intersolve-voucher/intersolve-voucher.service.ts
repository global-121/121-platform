import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { FspName } from '../../../fsp/enum/fsp-name.enum';
import { MessageContentType } from '../../../notifications/enum/message-type.enum';
import { ProgramNotificationEnum } from '../../../notifications/enum/program-notification.enum';
import {
  TwilioStatus,
  TwilioStatusCallbackDto,
} from '../../../notifications/twilio.dto';
import { ProgramFspConfigurationEntity } from '../../../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaPaymentDataDto } from '../../dto/pa-payment-data.dto';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';
import { UnusedVoucherDto } from '../../dto/unused-voucher.dto';
import { VoucherWithBalanceDto } from '../../dto/voucher-with-balance.dto';
import { ImageCodeService } from '../../imagecode/image-code.service';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { FinancialServiceProviderIntegrationInterface } from '../fsp-integration.interface';
import { IntersolveIssueCardResponse } from './dto/intersolve-issue-card-response.dto';
import { IntersolveVoucherJobName } from './dto/job-details.dto';
import { IntersolveVoucherPayoutStatus } from './enum/intersolve-voucher-payout-status.enum';
import { IntersolveVoucherResultCode } from './enum/intersolve-voucher-result-code.enum';
import { IntersolveVoucherApiService } from './instersolve-voucher.api.service';
import { IntersolveIssueVoucherRequestEntity } from './intersolve-issue-voucher-request.entity';
import { IntersolveVoucherInstructionsEntity } from './intersolve-voucher-instructions.entity';
import { IntersolveVoucherEntity } from './intersolve-voucher.entity';
import { QueueMessageService } from '../../../notifications/queue-message/queue-message.service';
import { MessageTemplateService } from '../../../notifications/message-template/message-template.service';
import { MessageProcessType } from '../../../notifications/message-job.dto';
import { RegistrationScopedRepository } from '../../../registration/registration-scoped.repository';
import { ScopedRepository } from '../../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../../utils/scope/createScopedRepositoryProvider.helper';
import { LanguageEnum } from '../../../registration/enum/language.enum';

@Injectable()
export class IntersolveVoucherService
  implements FinancialServiceProviderIntegrationInterface
{
  @InjectRepository(IntersolveVoucherInstructionsEntity)
  private readonly intersolveInstructionsRepository: Repository<IntersolveVoucherInstructionsEntity>;
  @InjectRepository(IntersolveIssueVoucherRequestEntity)
  private readonly intersolveVoucherRequestRepository: Repository<IntersolveIssueVoucherRequestEntity>;
  @InjectRepository(TransactionEntity)
  public readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProgramEntity)
  public readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramFspConfigurationEntity)
  public readonly programFspConfigurationRepository: Repository<ProgramFspConfigurationEntity>;

  private readonly fallbackLanguage = LanguageEnum.en;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepository: ScopedRepository<IntersolveVoucherEntity>,
    private readonly intersolveVoucherApiService: IntersolveVoucherApiService,
    private readonly imageCodeService: ImageCodeService,
    private readonly transactionsService: TransactionsService,
    private readonly queueMessageService: QueueMessageService,
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    programId: number,
    payment: number,
    useWhatsapp: boolean,
  ): Promise<void> {
    const config = await this.programFspConfigurationRepository
      .createQueryBuilder('fspConfig')
      .select('name')
      .addSelect('value')
      .where('fspConfig.programId = :programId', { programId })
      .andWhere('fsp.fsp = :fspName', { fspName: paPaymentList[0].fspName })
      .leftJoin('fspConfig.fsp', 'fsp')
      .getRawMany();

    const credentials: { username: string; password: string } = {
      username: config.find((c) => c.name === 'username')?.value,
      password: config.find((c) => c.name === 'password')?.value,
    };

    for (const paymentInfo of paPaymentList) {
      const paResult = await this.sendIndividualPayment(
        paymentInfo,
        useWhatsapp,
        paymentInfo.transactionAmount,
        payment,
        credentials,
      );
      if (!paResult) {
        continue;
      }

      // If 'waiting' then transaction is stored already earlier, to make sure it's there before status-callback comes in
      if (paResult.status !== StatusEnum.waiting) {
        const registration = await this.registrationScopedRepository.findOne({
          where: { referenceId: paResult.referenceId },
        });
        await this.storeTransactionResult(
          payment,
          paymentInfo.transactionAmount,
          registration.id,
          1,
          paResult.status,
          paResult.message,
          registration.programId,
        );
      }
    }
  }

  public async sendIndividualPayment(
    paymentInfo: PaPaymentDataDto,
    useWhatsapp: boolean,
    calculatedAmount: number,
    payment: number,
    credentials: { username: string; password: string },
  ): Promise<PaTransactionResultDto> {
    const paResult = new PaTransactionResultDto();
    paResult.referenceId = paymentInfo.referenceId;

    if (!credentials?.username || !credentials?.password) {
      paResult.status = StatusEnum.error;
      paResult.message =
        'Creating intersolve voucher failed. Error retrieving Intersolve credentials';
      return paResult;
    }

    const intersolveRefPos = this.getIntersolveRefPos();
    paResult.calculatedAmount = calculatedAmount;

    const voucher = await this.getReusableVoucher(
      paymentInfo.referenceId,
      payment,
    );

    if (voucher) {
      if (voucher.send) {
        // If an existing voucher is found, but already claimed, then skip this PA (this route should never happen)
        console.log(
          `Cannot submit payment ${payment} for PA ${paymentInfo.referenceId} as there is already a claimed voucher for this PA and this payment.`,
        );
        return;
      } else {
        // .. if existing voucher is found, then continue with that one, and don't create new one
        paResult.status = StatusEnum.success;
      }
    } else {
      // .. if no existing voucher found, then create new one
      const voucherInfo = await this.issueVoucher(
        calculatedAmount,
        intersolveRefPos,
        credentials.username,
        credentials.password,
      );
      voucherInfo.refPos = intersolveRefPos;

      if (voucherInfo.resultCode == IntersolveVoucherResultCode.Ok) {
        voucherInfo.voucher = await this.storeVoucher(
          voucherInfo,
          paymentInfo,
          payment,
          calculatedAmount,
        );
        paResult.status = StatusEnum.success;
      } else {
        paResult.status = StatusEnum.error;
        paResult.message =
          'Creating intersolve voucher failed. Status code: ' +
          (voucherInfo.resultCode ? voucherInfo.resultCode : 'unknown') +
          ' message: ' +
          (voucherInfo.resultDescription
            ? voucherInfo.resultDescription
            : 'unknown');
        await this.markVoucherAsToCancel(
          voucherInfo.cardId,
          voucherInfo.transactionId,
          voucherInfo.refPos,
        );
        return paResult;
      }
    }

    // If no whatsapp: return early
    if (!useWhatsapp) {
      paResult.status = StatusEnum.success;
      return paResult;
    }

    // Continue with whatsapp:
    return await this.sendWhatsapp(
      paymentInfo,
      paResult,
      calculatedAmount,
      payment,
    );
  }

  private getIntersolveRefPos(): number {
    return parseInt(crypto.randomBytes(5).toString('hex'), 16);
  }

  private async getReusableVoucher(
    referenceId: string,
    payment: number,
  ): Promise<IntersolveVoucherEntity> {
    const rawVoucher = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      //The .* is to prevent the raw query from prefixing with voucher_
      .select('voucher.*')
      .leftJoin('registration.images', 'images')
      .leftJoin('images.voucher', 'voucher')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId: referenceId,
      })
      .andWhere('voucher.payment = :payment', {
        payment: payment,
      })
      .getRawOne();
    if (!rawVoucher) {
      return;
    }
    const voucher: IntersolveVoucherEntity =
      this.intersolveVoucherScopedRepository.create(
        rawVoucher as IntersolveVoucherEntity,
      );
    return await this.intersolveVoucherScopedRepository.save(voucher);
  }

  private async issueVoucher(
    amount: number,
    intersolveRefPos: number,
    username: string,
    password: string,
  ): Promise<IntersolveIssueCardResponse> {
    const amountInCents = amount * 100;
    return await this.intersolveVoucherApiService.issueCard(
      amountInCents,
      intersolveRefPos,
      username,
      password,
    );
  }

  private async storeVoucher(
    voucherInfo: IntersolveIssueCardResponse,
    paPaymentData: PaPaymentDataDto,
    payment: number,
    amount: number,
  ): Promise<IntersolveVoucherEntity> {
    const voucherData = await this.storeVoucherData(
      voucherInfo.cardId,
      voucherInfo.pin,
      paPaymentData.paymentAddress,
      payment,
      amount,
    );

    await this.imageCodeService.createVoucherExportVouchers(
      voucherData,
      paPaymentData.referenceId,
    );

    return voucherData;
  }

  private async sendWhatsapp(
    paymentInfo: PaPaymentDataDto,
    paResult: PaTransactionResultDto,
    amount: number,
    payment: number,
  ): Promise<PaTransactionResultDto> {
    const transferResult = await this.sendVoucherWhatsapp(
      paymentInfo,
      payment,
      amount,
    );

    paResult.status = transferResult.status;
    if (transferResult.status === StatusEnum.error) {
      paResult.message =
        'Voucher(s) created, but something went wrong in sending voucher.\n' +
        transferResult.message;
    } else {
      paResult.customData = transferResult.customData;
    }

    return paResult;
  }

  public async sendVoucherWhatsapp(
    paymentInfo: PaPaymentDataDto,
    payment: number,
    calculatedAmount: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    result.referenceId = paymentInfo.referenceId;

    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: paymentInfo.referenceId },
    });

    const programId = registration.programId;
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    const language = registration.preferredLanguage || this.fallbackLanguage;
    let whatsappPayment = await this.getNotificationText(
      program,
      ProgramNotificationEnum.whatsappPayment,
      language,
    );
    whatsappPayment = whatsappPayment
      .split('[[amount]]')
      .join(String(calculatedAmount));

    await this.queueMessageService.addMessageToQueue(
      registration,
      whatsappPayment,
      null,
      MessageContentType.paymentTemplated,
      MessageProcessType.whatsappTemplateVoucher,
      null,
      { payment: payment, amount: calculatedAmount },
      paymentInfo.bulkSize,
    );
    result.status = StatusEnum.waiting;
    return result;
  }

  public async getNotificationText(
    program: ProgramEntity,
    type: string,
    language?: string,
  ): Promise<string> {
    const messageTemplates =
      await this.messageTemplateService.getMessageTemplatesByProgramId(
        program.id,
      );

    const notification = messageTemplates.find(
      (template) => template.type === type && template.language === language,
    );
    if (notification) {
      return notification.message;
    }

    const fallbackNotification = messageTemplates.find(
      (template) =>
        template.type === type && template.language === this.fallbackLanguage,
    );
    if (fallbackNotification) {
      return fallbackNotification.message;
    }

    return '';
  }

  private async storeVoucherData(
    cardNumber: string,
    pin: string,
    phoneNumber: string,
    payment: number,
    amount: number,
  ): Promise<IntersolveVoucherEntity> {
    const voucherData = new IntersolveVoucherEntity();
    voucherData.barcode = cardNumber;
    voucherData.pin = pin.toString();
    voucherData.whatsappPhoneNumber = phoneNumber;
    voucherData.send = false;
    voucherData.payment = payment;
    voucherData.amount = amount;
    return this.intersolveVoucherScopedRepository.save(voucherData);
  }

  public async processStatus(
    statusCallbackData: TwilioStatusCallbackDto,
    transactionId: number,
  ): Promise<void> {
    const succesStatuses = [TwilioStatus.delivered, TwilioStatus.read];
    const failStatuses = [TwilioStatus.undelivered, TwilioStatus.failed];
    let status: string;
    if (succesStatuses.includes(statusCallbackData.MessageStatus)) {
      status = StatusEnum.success;
    } else if (failStatuses.includes(statusCallbackData.MessageStatus)) {
      status = StatusEnum.error;
    } else {
      // For other statuses, no update needed
      return;
    }

    const transactionToUpdateFilter = {
      id: transactionId,
    };
    // if success, then only update if transaction is a 'voucher sent' message
    // if error, then always update
    if (status === StatusEnum.success) {
      transactionToUpdateFilter['transactionStep'] = 2;
    }
    // No scoped needed as this is for incoming whatsapp messages
    await this.transactionRepository.update(transactionToUpdateFilter, {
      status: status,
      errorMessage:
        status === StatusEnum.error
          ? (statusCallbackData.ErrorMessage || '') +
            ' (ErrorCode: ' +
            statusCallbackData.ErrorCode +
            ')'
          : null,
    });
  }

  public async exportVouchers(
    referenceId: string,
    payment: number,
    programId: number,
  ): Promise<any> {
    const voucher = await this.getVoucher(referenceId, payment, programId);
    return voucher.image;
  }

  private async getVoucher(
    referenceId: string,
    payment: number,
    programId: number,
  ): Promise<any> {
    const registration = await this.registrationScopedRepository.findOne({
      where: { referenceId: referenceId, programId: programId },
      relations: ['images', 'images.voucher'],
    });
    if (!registration) {
      throw new HttpException(
        'PA with this referenceId not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const voucher = registration.images.find(
      (image) => image.voucher.payment === payment,
    );
    if (!voucher) {
      throw new HttpException(
        'Voucher not found. Maybe this payment was not (yet) made to this PA.',
        HttpStatus.NOT_FOUND,
      );
    }
    return voucher;
  }

  public async getInstruction(programId: number): Promise<any> {
    const intersolveInstructionsEntity =
      await this.intersolveInstructionsRepository.findOne({
        where: { programId: programId },
      });

    if (!intersolveInstructionsEntity) {
      throw new HttpException(
        'Image not found. Please upload an image using POST and try again.',
        HttpStatus.NOT_FOUND,
      );
    }

    return intersolveInstructionsEntity.image;
  }

  public async postInstruction(
    programId: number,
    instructionsFileBlob,
  ): Promise<any> {
    let intersolveInstructionsEntity =
      await this.intersolveInstructionsRepository.findOne({
        where: { programId: programId },
      });

    if (!intersolveInstructionsEntity) {
      intersolveInstructionsEntity = new IntersolveVoucherInstructionsEntity();
    }

    intersolveInstructionsEntity.image = instructionsFileBlob.buffer;
    intersolveInstructionsEntity.programId = programId;

    await this.intersolveInstructionsRepository.save(
      intersolveInstructionsEntity,
    );
  }

  private async markVoucherAsToCancel(
    cardId: string,
    transactionId: string,
    refPos: number,
  ): Promise<void> {
    if (cardId && transactionId) {
      await this.intersolveVoucherApiService.markAsToCancel(
        cardId,
        transactionId,
      );
    } else if (refPos) {
      await this.intersolveVoucherApiService.markAsToCancelByRefPos(refPos);
    }
  }

  public async getVoucherBalance(
    referenceId: string,
    payment: number,
    programId: number,
  ): Promise<number> {
    const voucher = await this.getVoucher(referenceId, payment, programId);
    return await this.getBalance(voucher.voucher, programId);
  }

  private async getBalance(
    intersolveVoucher: IntersolveVoucherEntity,
    programId: number,
  ): Promise<number> {
    const configQuery = await this.programFspConfigurationRepository
      .createQueryBuilder('fspConfig')
      .select('name')
      .addSelect('value')
      .where('fspConfig.programId = :programId', { programId: programId })
      .andWhere('fsp.fsp = :fspName', {
        fspName: intersolveVoucher.whatsappPhoneNumber
          ? FspName.intersolveVoucherWhatsapp
          : FspName.intersolveVoucherPaper,
      })
      .leftJoin('fspConfig.fsp', 'fsp');

    const config = await configQuery.getRawMany();
    let credentials: { username: string; password: string };
    try {
      credentials = {
        username: config.find((c) => c.name === 'username').value,
        password: config.find((c) => c.name === 'password').value,
      };
    } catch (error) {
      throw new HttpException(
        {
          error:
            'An error occured during the retrieval of the FSP configuration. Please contact the 121 platform team.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const getCard = await this.intersolveVoucherApiService.getCard(
      intersolveVoucher.barcode,
      intersolveVoucher.pin,
      credentials.username,
      credentials.password,
    );
    const realBalance = getCard.balance / getCard.balanceFactor;

    intersolveVoucher.lastRequestedBalance = realBalance;
    intersolveVoucher.updatedLastRequestedBalance = new Date();
    await this.intersolveVoucherScopedRepository.save(intersolveVoucher);
    return realBalance;
  }

  public async getToCancelVouchers(): Promise<
    IntersolveIssueVoucherRequestEntity[]
  > {
    const toCancelVouchers = await this.intersolveVoucherRequestRepository.find(
      {
        where: {
          toCancel: true,
        },
      },
    );

    return toCancelVouchers;
  }

  public async getUnusedVouchers(
    programId?: number,
  ): Promise<UnusedVoucherDto[]> {
    const unusedVouchersEntities = await this.intersolveVoucherScopedRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.image', 'image')
      .leftJoinAndSelect('image.registration', 'registration')
      .andWhere('voucher.balanceUsed = false')
      .andWhere('registration.programId = :programId', {
        programId: programId,
      })
      .getMany();

    const unusedVouchersDtos: UnusedVoucherDto[] = [];
    for await (const voucher of unusedVouchersEntities) {
      if (voucher.lastRequestedBalance === voucher.amount) {
        const unusedVoucher = new UnusedVoucherDto();
        unusedVoucher.payment = voucher.payment;
        unusedVoucher.issueDate = voucher.created;
        unusedVoucher.whatsappPhoneNumber = voucher.whatsappPhoneNumber;
        unusedVoucher.phoneNumber = voucher.image[0].registration.phoneNumber;
        unusedVoucher.referenceId = voucher.image[0].registration.referenceId;
        unusedVoucher.lastExternalUpdate = voucher.updatedLastRequestedBalance;
        unusedVouchersDtos.push(unusedVoucher);
      }
    }
    return unusedVouchersDtos;
  }

  public async updateUnusedVouchers(programId?: number): Promise<void> {
    const maxId = (
      await this.intersolveVoucherScopedRepository
        .createQueryBuilder('voucher')
        .select('MAX(voucher.id)', 'max')
        .leftJoin('voucher.image', 'image')
        .leftJoin('image.registration', 'registration')
        .where('registration.programId = :programId', {
          programId: programId,
        })
        .getRawOne()
    )?.max;
    if (!maxId) {
      // No vouchers found yet
      return;
    }

    let id = 1;
    // Run this in batches of 1,000 as it is performance-heavy
    while (id <= maxId) {
      const previouslyUnusedVouchers =
        await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .leftJoinAndSelect('voucher.image', 'image')
          .leftJoinAndSelect('image.registration', 'registration')
          .andWhere('voucher.balanceUsed = false')
          .andWhere(`voucher.id BETWEEN :id AND (:id + 1000 - 1)`, {
            id: id,
          })
          .andWhere('registration.programId = :programId', {
            programId: programId,
          })
          .getMany();
      for await (const voucher of previouslyUnusedVouchers) {
        const balance = await this.getBalance(voucher, programId);
        if (balance !== voucher.amount) {
          voucher.balanceUsed = true;
          voucher.send = true;
          await this.intersolveVoucherScopedRepository.save(voucher);
        }
      }
      id += 1000;
    }
  }

  public async storeTransactionResult(
    payment: number,
    amount: number,
    registrationId: number,
    transactionStep: number,
    status: StatusEnum,
    errorMessage: string,
    programId: number,
    messageSid?: string,
    intersolveVoucherId?: number,
  ): Promise<void> {
    if (intersolveVoucherId) {
      const intersolveVoucher =
        await this.intersolveVoucherScopedRepository.findOne({
          where: { id: intersolveVoucherId },
        });
      intersolveVoucher.send = true;
      await this.intersolveVoucherScopedRepository.save(intersolveVoucher);
    }
    const transactionResultDto = await this.createTransactionResult(
      amount,
      registrationId,
      transactionStep,
      status,
      errorMessage,
      messageSid,
    );
    await this.transactionsService.storeTransactionUpdateStatus(
      transactionResultDto,
      programId,
      payment,
      transactionStep,
    );
  }

  public async createTransactionResult(
    amount: number,
    registrationId: number,
    transactionStep: number,
    status: StatusEnum,
    errorMessage: string,
    messageSid?: string,
  ): Promise<PaTransactionResultDto> {
    const registration = await this.registrationScopedRepository.findOne({
      where: { id: registrationId },
      relations: ['fsp', 'program'],
    });

    const transactionResult = new PaTransactionResultDto();
    transactionResult.calculatedAmount = amount;
    transactionResult.date = new Date();
    transactionResult.referenceId = registration.referenceId;

    transactionResult.message = errorMessage;
    transactionResult.customData = JSON.parse(JSON.stringify({}));
    if (messageSid) {
      transactionResult.messageSid = messageSid;
    }
    if (registration.fsp.fsp === FspName.intersolveVoucherWhatsapp) {
      transactionResult.customData['IntersolvePayoutStatus'] =
        transactionStep === 1
          ? IntersolveVoucherPayoutStatus.InitialMessage
          : IntersolveVoucherPayoutStatus.VoucherSent;
    }

    transactionResult.status = status;

    if (registration.fsp.fsp === FspName.intersolveVoucherWhatsapp) {
      transactionResult.fspName = FspName.intersolveVoucherWhatsapp;
    }
    if (registration.fsp.fsp === FspName.intersolveVoucherPaper) {
      transactionResult.fspName = FspName.intersolveVoucherPaper;
    }
    return transactionResult;
  }

  public async updateVoucherBalanceJob(
    programId: number,
    jobName: IntersolveVoucherJobName,
  ): Promise<void> {
    if (jobName === IntersolveVoucherJobName.getLastestVoucherBalance) {
      const maxId = (
        await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .select('MAX(voucher.id)', 'max')
          .leftJoin('voucher.image', 'image')
          .leftJoin('image.registration', 'registration')
          .andWhere('registration.programId = :programId', {
            programId: programId,
          })
          .getRawOne()
      )?.max;
      let id = 1;

      // Run this in batches of 1,000 as it is performance-heavy
      while (id <= maxId) {
        // Query gets all voouher that need to be checked these can be:
        // 1) Vouchers  with null (which have never been checked)
        // 2) Voucher with a balance 0 (which could have been used more in the meantime)
        const q = await this.intersolveVoucherScopedRepository
          .createQueryBuilder('voucher')
          .leftJoinAndSelect('voucher.image', 'image')
          .leftJoinAndSelect('image.registration', 'registration')
          .andWhere('voucher.lastRequestedBalance IS DISTINCT from 0')
          .andWhere(`voucher.id BETWEEN :id AND (:id + 1000 - 1)`, {
            id: id,
          })
          .andWhere('registration.programId = :programId', {
            programId: programId,
          });

        const vouchersToUpdate = await q.getMany();

        for await (const voucher of vouchersToUpdate) {
          const balance = await this.getBalance(voucher, programId);
          if (balance !== voucher.amount) {
            voucher.balanceUsed = true;
            voucher.send = true;
            await this.intersolveVoucherScopedRepository.save(voucher);
          }
        }
        id += 1000;
      }
    }
    console.log('Finished: ', jobName);
  }

  public async getVouchersWithBalance(
    programId: number,
  ): Promise<VoucherWithBalanceDto[]> {
    const vouchersWithBalance: VoucherWithBalanceDto[] = [];
    const voucherWithBalanceRaw = await this.intersolveVoucherScopedRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.image', 'image')
      .leftJoinAndSelect('image.registration', 'registration')
      .andWhere('voucher.lastRequestedBalance > 0')
      .andWhere('registration.programId = :programId', {
        programId: programId,
      })
      .getMany();
    for await (const voucher of voucherWithBalanceRaw) {
      const voucherWithBalance =
        await this.createVoucherWithBalanceDto(voucher);
      vouchersWithBalance.push(voucherWithBalance);
    }
    return vouchersWithBalance;
  }

  private async createVoucherWithBalanceDto(
    voucher: IntersolveVoucherEntity,
  ): Promise<VoucherWithBalanceDto> {
    const voucherWithBalance = new VoucherWithBalanceDto();
    voucherWithBalance.paNumber =
      voucher.image[0].registration.registrationProgramId;
    voucherWithBalance.name = await voucher.image[0].registration.getFullName();
    voucherWithBalance.phoneNumber = voucher.image[0].registration.phoneNumber;
    voucherWithBalance.whatsappPhoneNumber = voucher.whatsappPhoneNumber;
    voucherWithBalance.paStatus =
      voucher.image[0].registration.registrationStatus;
    voucherWithBalance.partnerName =
      await voucher.image[0].registration.getRegistrationDataValueByName(
        'namePartnerOrganization',
      );
    voucherWithBalance.payment = voucher.payment;
    voucherWithBalance.issueDate = voucher.created;
    voucherWithBalance.originalBalance = voucher.amount;
    voucherWithBalance.remainingBalance = voucher.lastRequestedBalance;
    voucherWithBalance.updatedRemainingBalanceUTC =
      voucher.updatedLastRequestedBalance;
    voucherWithBalance.voucherSend = voucher.send;
    return voucherWithBalance;
  }
}
