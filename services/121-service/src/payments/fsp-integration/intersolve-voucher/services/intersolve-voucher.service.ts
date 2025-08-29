import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import Redis from 'ioredis';
import { Equal, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { ProjectNotificationEnum } from '@121-service/src/notifications/enum/project-notification.enum';
import { MessageProcessType } from '@121-service/src/notifications/message-job.dto';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import {
  TwilioStatus,
  TwilioStatusCallbackDto,
} from '@121-service/src/notifications/twilio.dto';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { UnusedVoucherDto } from '@121-service/src/payments/dto/unused-voucher.dto';
import { VoucherWithBalanceDto } from '@121-service/src/payments/dto/voucher-with-balance.dto';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveIssueCardResponse } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-issue-card-response.dto';
import { IntersolveStoreVoucherOptionsDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-store-voucher-options.dto';
import { IntersolveVoucherJobDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/intersolve-voucher-job.dto';
import { IntersolveVoucherPayoutStatus } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { IntersolveVoucherResultCode } from '@121-service/src/payments/fsp-integration/intersolve-voucher/enum/intersolve-voucher-result-code.enum';
import { IntersolveIssueVoucherRequestEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherInstructionsEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher-instructions.entity';
import { IntersolveVoucherApiService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/instersolve-voucher.api.service';
import { ImageCodeService } from '@121-service/src/payments/imagecode/image-code.service';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { UsernamePasswordInterface } from '@121-service/src/project-fsp-configurations/interfaces/username-password.interface';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { RegistrationDataService } from '@121-service/src/registration/modules/registration-data/registration-data.service';
import { RegistrationUtilsService } from '@121-service/src/registration/modules/registration-utilts/registration-utils.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class IntersolveVoucherService implements FspIntegrationInterface {
  @InjectRepository(IntersolveVoucherInstructionsEntity)
  private readonly intersolveInstructionsRepository: Repository<IntersolveVoucherInstructionsEntity>;
  @InjectRepository(IntersolveIssueVoucherRequestEntity)
  private readonly intersolveVoucherRequestRepository: Repository<IntersolveIssueVoucherRequestEntity>;
  @InjectRepository(TransactionEntity)
  public readonly transactionRepository: Repository<TransactionEntity>;
  @InjectRepository(ProjectEntity)
  public readonly projectRepository: Repository<ProjectEntity>;

  private readonly fallbackLanguage = LanguageEnum.en;

  public constructor(
    private readonly registrationUtilsService: RegistrationUtilsService,
    private readonly registrationDataService: RegistrationDataService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepository: ScopedRepository<IntersolveVoucherEntity>,
    private readonly intersolveVoucherApiService: IntersolveVoucherApiService,
    private readonly imageCodeService: ImageCodeService,
    private readonly transactionsService: TransactionsService,
    private readonly queueMessageService: MessageQueuesService,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly queuesService: QueuesRegistryService,
    public readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,

    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  public async sendPayment(
    paPaymentList: PaPaymentDataDto[],
    projectId: number,
    paymentId: number,
    useWhatsapp: boolean,
  ): Promise<void> {
    for (const paymentInfo of paPaymentList) {
      const job =
        await this.queuesService.transactionJobIntersolveVoucherQueue.add(
          JobNames.default,
          {
            paymentInfo,
            useWhatsapp,
            paymentId,
            projectId,
          },
        );

      await this.redisClient.sadd(getRedisSetName(job.data.projectId), job.id);
    }
  }

  public async processQueuedPayment(
    jobData: IntersolveVoucherJobDto,
  ): Promise<void> {
    const credentials =
      await this.projectFspConfigurationRepository.getUsernamePasswordProperties(
        jobData.paymentInfo.projectFspConfigurationId,
      );
    const paResult = await this.sendIndividualPayment(
      jobData.paymentInfo,
      jobData.useWhatsapp,
      jobData.paymentInfo.transactionAmount,
      jobData.paymentId,
      credentials,
    );
    if (!paResult) {
      return;
    }

    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(paResult.referenceId) },
    });
    await this.storeTransactionResult(
      jobData.paymentId,
      jobData.paymentInfo.transactionAmount,
      registration.id,
      1,
      paResult.status,
      paResult.message ?? null,
      registration.projectId,
      {
        projectFspConfigurationId:
          jobData.paymentInfo.projectFspConfigurationId,
        userId: jobData.paymentInfo.userId,
      },
    );
  }

  public async sendIndividualPayment(
    paymentInfo: PaPaymentDataDto,
    useWhatsapp: boolean,
    calculatedAmount: number,
    paymentId: number,
    credentials: UsernamePasswordInterface,
  ) {
    const paResult = new PaTransactionResultDto();
    paResult.referenceId = paymentInfo.referenceId;

    if (!credentials?.username || !credentials?.password) {
      paResult.status = TransactionStatusEnum.error;
      paResult.message =
        'Creating intersolve voucher failed. Error retrieving Intersolve credentials';
      return paResult;
    }

    const intersolveRefPos = this.getIntersolveRefPos();
    paResult.calculatedAmount = calculatedAmount;

    const voucher = await this.getReusableVoucher(
      paymentInfo.referenceId,
      paymentId,
    );

    if (voucher) {
      if (voucher.send) {
        // If an existing voucher is found, but already claimed, then skip this PA (this route should never happen)
        console.log(
          `Cannot submit payment ${paymentId} for PA ${paymentInfo.referenceId} as there is already a claimed voucher for this PA and this payment.`,
        );
        return;
      } else {
        // .. if existing voucher is found, then continue with that one, and don't create new one
        paResult.status = TransactionStatusEnum.success;
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
          paymentId,
          calculatedAmount,
        );
        paResult.status = TransactionStatusEnum.success;
      } else {
        paResult.status = TransactionStatusEnum.error;
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
      paResult.status = TransactionStatusEnum.success;
      return paResult;
    }

    // Continue with whatsapp:
    return await this.sendWhatsapp(
      paymentInfo,
      paResult,
      calculatedAmount,
      paymentId,
    );
  }

  private getIntersolveRefPos(): number {
    return parseInt(crypto.randomBytes(5).toString('hex'), 16);
  }

  private async getReusableVoucher(referenceId: string, paymentId: number) {
    const rawVoucher = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      //The .* is to prevent the raw query from prefixing with voucher_
      .select('voucher.*')
      .leftJoin('registration.images', 'images')
      .leftJoin('images.voucher', 'voucher')
      .andWhere('registration.referenceId = :referenceId', {
        referenceId,
      })
      .andWhere('voucher."paymentId" = :paymentId', {
        paymentId,
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
    paymentId: number,
    amount: number,
  ): Promise<IntersolveVoucherEntity> {
    const voucherData = await this.storeVoucherData(
      voucherInfo.cardId,
      voucherInfo.pin,
      paPaymentData.paymentAddress,
      paymentId,
      amount,
      paPaymentData.userId,
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
    paymentId: number,
  ): Promise<PaTransactionResultDto> {
    const transferResult = await this.sendVoucherWhatsapp(
      paymentInfo,
      paymentId,
      amount,
    );

    paResult.status = transferResult.status;
    if (transferResult.status === TransactionStatusEnum.error) {
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
    paymentId: number,
    calculatedAmount: number,
  ): Promise<PaTransactionResultDto> {
    const result = new PaTransactionResultDto();
    result.referenceId = paymentInfo.referenceId;

    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { referenceId: Equal(paymentInfo.referenceId) },
    });

    const projectId = registration.projectId;
    const project = await this.projectRepository.findOneByOrFail({
      id: projectId,
    });
    const language = registration.preferredLanguage || this.fallbackLanguage;
    const contentSid = await this.getNotificationContentSid(
      project,
      ProjectNotificationEnum.whatsappPayment,
      language,
    );

    await this.queueMessageService.addMessageJob({
      registration,
      contentSid: contentSid ?? undefined,
      messageContentType: MessageContentType.paymentTemplated,
      messageProcessType: MessageProcessType.whatsappTemplateVoucher,
      customData: { paymentId, amount: calculatedAmount },
      bulksize: paymentInfo.bulkSize,
      userId: paymentInfo.userId,
    });
    result.status = TransactionStatusEnum.waiting;
    return result;
  }

  public async getNotificationContentSid(
    project: ProjectEntity,
    type: string,
    language?: string,
  ): Promise<string | undefined> {
    const messageTemplates =
      await this.messageTemplateService.getMessageTemplatesByProjectId(
        project.id,
      );

    const notification = messageTemplates.find(
      (template) => template.type === type && template.language === language,
    );
    if (notification?.contentSid) {
      return notification.contentSid;
    }

    const fallbackNotification = messageTemplates.find(
      (template) =>
        template.type === type && template.language === this.fallbackLanguage,
    );
    if (fallbackNotification?.contentSid) {
      return fallbackNotification.contentSid;
    }
  }

  private async storeVoucherData(
    cardNumber: string,
    pin: string,
    phoneNumber: string,
    paymentId: number,
    amount: number,
    userId: number,
  ): Promise<IntersolveVoucherEntity> {
    const voucherData = new IntersolveVoucherEntity();
    voucherData.barcode = cardNumber;
    voucherData.pin = pin.toString();
    voucherData.whatsappPhoneNumber = phoneNumber;
    voucherData.send = false;
    voucherData.paymentId = paymentId;
    voucherData.amount = amount;
    voucherData.userId = userId;
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
      status = TransactionStatusEnum.success;
    } else if (failStatuses.includes(statusCallbackData.MessageStatus)) {
      status = TransactionStatusEnum.error;
    } else {
      // For other statuses, no update needed
      return;
    }

    const transactionToUpdateFilter = {
      id: transactionId,
    };
    // if success, then only update if transaction is a 'voucher sent' message
    // if error, then always update
    if (status === TransactionStatusEnum.success) {
      transactionToUpdateFilter['transactionStep'] = 2;
    }
    // No scoped needed as this is for incoming whatsapp messages
    await this.transactionRepository.update(transactionToUpdateFilter, {
      status,
      errorMessage:
        status === TransactionStatusEnum.error
          ? (statusCallbackData.ErrorMessage || '') +
            ' (ErrorCode: ' +
            statusCallbackData.ErrorCode +
            ')'
          : null,
    });
  }

  public async updateTransactionBasedTwilioMessageCreate(
    paymentId: number,
    regisrationId: number,
    status: TransactionStatusEnum,
    transactionStep: number,
    messageSid?: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.transactionsService.updateWaitingTransaction(
      paymentId,
      regisrationId,
      status,
      transactionStep,
      messageSid,
      errorMessage,
    );
  }

  public async exportVouchers(
    referenceId: string,
    paymentId: number,
    projectId: number,
  ): Promise<any> {
    const voucher = await this.getVoucher(referenceId, paymentId, projectId);
    const image = await this.imageCodeService.generateVoucherImage({
      dateTime: voucher.created,
      amount: voucher.amount,
      code: voucher.barcode,
      pin: voucher.pin,
    });
    return image;
  }

  private async getVoucher(
    referenceId: string,
    paymentId: number,
    projectId: number,
  ): Promise<IntersolveVoucherEntity> {
    const registration = await this.registrationScopedRepository.findOne({
      where: {
        referenceId: Equal(referenceId),
        projectId: Equal(projectId),
      },
      relations: ['images', 'images.voucher'],
    });
    if (!registration) {
      throw new HttpException(
        'PA with this referenceId not found (within your scope)',
        HttpStatus.NOT_FOUND,
      );
    }

    const imageCodeExportVouchersEntity = registration.images.find(
      (image) => image.voucher.paymentId === paymentId,
    );
    if (!imageCodeExportVouchersEntity) {
      throw new HttpException(
        'Voucher not found. Maybe this payment was not (yet) made to this PA.',
        HttpStatus.NOT_FOUND,
      );
    }
    return imageCodeExportVouchersEntity.voucher;
  }

  public async getInstruction(projectId: number): Promise<any> {
    const intersolveInstructionsEntity =
      await this.intersolveInstructionsRepository.findOne({
        where: { projectId: Equal(projectId) },
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
    projectId: number,
    instructionsFileBlob,
  ): Promise<any> {
    let intersolveInstructionsEntity =
      await this.intersolveInstructionsRepository.findOne({
        where: { projectId: Equal(projectId) },
      });

    if (!intersolveInstructionsEntity) {
      intersolveInstructionsEntity = new IntersolveVoucherInstructionsEntity();
    }

    intersolveInstructionsEntity.image = instructionsFileBlob.buffer;
    intersolveInstructionsEntity.projectId = projectId;

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
    paymentId: number,
    projectId: number,
  ): Promise<number> {
    const voucher = await this.getVoucher(referenceId, paymentId, projectId);
    const credentials =
      await this.projectFspConfigurationRepository.getUsernamePasswordPropertiesByVoucherId(
        voucher.id,
      );
    return await this.getAndUpdateBalance(voucher, projectId, credentials);
  }

  public async getAndUpdateBalance(
    intersolveVoucher: IntersolveVoucherEntity,
    projectId: number,
    credentials: UsernamePasswordInterface,
  ): Promise<number> {
    if (!credentials?.username || !credentials?.password) {
      throw new Error(
        `Could not retrieve configuration of FSP Intersolve Voucher for project: ${projectId}. Please contact the 121 platform team.`,
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
    if (realBalance !== intersolveVoucher.amount) {
      intersolveVoucher.balanceUsed = true;
      intersolveVoucher.send = true;
    }
    await this.intersolveVoucherScopedRepository.save(intersolveVoucher);
    return realBalance;
  }

  public async getToCancelVouchers(): Promise<
    IntersolveIssueVoucherRequestEntity[]
  > {
    const toCancelVouchers = await this.intersolveVoucherRequestRepository.find(
      {
        where: {
          toCancel: Equal(true),
        },
      },
    );

    return toCancelVouchers;
  }

  public async getUnusedVouchers(
    projectId?: number,
  ): Promise<UnusedVoucherDto[]> {
    const unusedVouchersEntities = await this.intersolveVoucherScopedRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.image', 'image')
      .leftJoinAndSelect('image.registration', 'registration')
      .andWhere('voucher.balanceUsed = false')
      .andWhere('registration.projectId = :projectId', {
        projectId,
      })
      .getMany();

    const unusedVouchersDtos: UnusedVoucherDto[] = [];
    for await (const voucher of unusedVouchersEntities) {
      if (voucher.lastRequestedBalance === voucher.amount) {
        const unusedVoucher = new UnusedVoucherDto();
        unusedVoucher.referenceId = voucher.image[0].registration.referenceId;
        unusedVoucher.paymentId = voucher.paymentId ?? undefined;
        unusedVoucher.issueDate = voucher.created;
        unusedVoucher.whatsappPhoneNumber =
          voucher.whatsappPhoneNumber ?? undefined;
        unusedVoucher.phoneNumber =
          voucher.image[0].registration.phoneNumber ?? undefined;
        unusedVoucher.lastExternalUpdate =
          voucher.updatedLastRequestedBalance ?? undefined;
        unusedVouchersDtos.push(unusedVoucher);
      }
    }
    return unusedVouchersDtos;
  }

  public async storeTransactionResult(
    paymentId: number,
    amount: number,
    registrationId: number,
    transactionStep: number,
    status: TransactionStatusEnum,
    errorMessage: string | null,
    projectId: number,
    options: IntersolveStoreVoucherOptionsDto,
  ): Promise<void> {
    if (options.intersolveVoucherId) {
      const intersolveVoucher =
        await this.intersolveVoucherScopedRepository.findOneOrFail({
          where: { id: Equal(options.intersolveVoucherId) },
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
      options.messageSid,
    );

    let userId = options.userId;
    let projectFspConfigurationId = options.projectFspConfigurationId;
    if (transactionStep === 2) {
      const userFspConfigIdObject =
        await this.getUserFspConfigIdForTransactionStep2(
          registrationId,
          paymentId,
        );
      if (userFspConfigIdObject) {
        userId = userFspConfigIdObject.userId;
        projectFspConfigurationId =
          userFspConfigIdObject.projectFspConfigurationId;
      }
    }

    if (userId === undefined) {
      throw new Error(
        'Could not find userId for transaction in storeTransactionResult.',
      );
    }
    if (projectFspConfigurationId === undefined) {
      throw new Error(
        'Could not find projectFspConfigurationId for transaction in storeTransactionResult.',
      );
    }

    const transactionRelationDetails = {
      projectId,
      paymentId,
      userId,
      projectFspConfigurationId,
    };

    await this.transactionsService.storeTransactionUpdateStatus(
      transactionResultDto,
      transactionRelationDetails,
    );
  }

  private async getUserFspConfigIdForTransactionStep2(
    registrationId: number,
    paymentId: number,
  ) {
    const transaction: null | {
      userId: number;
      projectFspConfigurationId: number;
    } = await this.transactionRepository.findOne({
      where: {
        registrationId: Equal(registrationId),
        paymentId: Equal(paymentId),
      },
      order: { created: 'DESC' },
      select: ['userId', 'projectFspConfigurationId'],
    });
    return transaction;
  }

  public async createTransactionResult(
    amount: number,
    registrationId: number,
    transactionStep: number,
    status: TransactionStatusEnum,
    errorMessage: string | null,
    messageSid?: string,
  ): Promise<PaTransactionResultDto> {
    const registration = await this.registrationScopedRepository.findOneOrFail({
      where: { id: Equal(registrationId) },
      relations: ['projectFspConfiguration', 'project'],
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

    const fspNameOfRegistration = registration.projectFspConfiguration.fspName;
    if (fspNameOfRegistration === Fsps.intersolveVoucherWhatsapp) {
      transactionResult.customData['IntersolvePayoutStatus'] =
        transactionStep === 1
          ? IntersolveVoucherPayoutStatus.InitialMessage
          : IntersolveVoucherPayoutStatus.VoucherSent;
    }

    transactionResult.status = status;

    if (fspNameOfRegistration === Fsps.intersolveVoucherWhatsapp) {
      transactionResult.fspName = Fsps.intersolveVoucherWhatsapp;
    }
    if (fspNameOfRegistration === Fsps.intersolveVoucherPaper) {
      transactionResult.fspName = Fsps.intersolveVoucherPaper;
    }
    return transactionResult;
  }

  public async getVouchersWithBalance(
    projectId: number,
  ): Promise<VoucherWithBalanceDto[]> {
    const vouchersWithBalance: VoucherWithBalanceDto[] = [];
    const voucherWithBalanceRaw = await this.intersolveVoucherScopedRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.image', 'image')
      .leftJoinAndSelect('image.registration', 'registration')
      .andWhere('voucher.lastRequestedBalance > 0')
      .andWhere('registration.projectId = :projectId', {
        projectId,
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
      voucher.image[0].registration.registrationProjectId;
    voucherWithBalance.name = await this.registrationUtilsService.getFullName(
      voucher.image[0].registration,
    );
    voucherWithBalance.phoneNumber =
      voucher.image[0].registration.phoneNumber ?? undefined;
    voucherWithBalance.whatsappPhoneNumber =
      voucher.whatsappPhoneNumber ?? undefined;
    voucherWithBalance.paStatus =
      voucher.image[0].registration.registrationStatus ?? undefined;
    voucherWithBalance.partnerName =
      (await this.registrationDataService.getRegistrationDataValueByName(
        voucher.image[0].registration,
        'namePartnerOrganization',
      )) ?? undefined;

    voucherWithBalance.paymentId = voucher.paymentId ?? undefined;
    voucherWithBalance.issueDate = voucher.created;
    voucherWithBalance.originalBalance = voucher.amount ?? undefined;
    voucherWithBalance.remainingBalance =
      voucher.lastRequestedBalance ?? undefined;
    voucherWithBalance.updatedRemainingBalanceUTC =
      voucher.updatedLastRequestedBalance ?? undefined;
    voucherWithBalance.voucherSend = voucher.send ?? undefined;
    return voucherWithBalance;
  }

  /**
   * Removes image codes older than one day as they're no longer needed.
   *
   * Timeline of image code usage:
   * 1. Image/URL is created immediately before sending the Twilio message
   * 2. Twilio downloads the image within seconds after the request is sent
   * 3. Once downloaded, the image code serves no further purpose
   *
   * A one-day retention provides a generous safety buffer (only seconds are actually needed),
   * ensuring any delayed processing or retry attempts have completed while preventing
   * unnecessary storage consumption and minimizes the risk by reducing the amount of voucher exposed via the API.
   *
   * @param mockCurrentDate - ONLY for testing purposes! There is no easy way to mock the current date in our test setup
   */
  public async removeDeprecatedImageCodes(
    mockCurrentDate?: string | undefined,
  ): Promise<number> {
    let dateFilter: Date;
    if (mockCurrentDate && IS_DEVELOPMENT) {
      dateFilter = new Date(mockCurrentDate);
    } else {
      dateFilter = new Date();
    }
    dateFilter.setDate(dateFilter.getDate() - 1);
    return await this.imageCodeService.removeImageCodesCreatedBefore({
      date: dateFilter,
    });
  }
}
