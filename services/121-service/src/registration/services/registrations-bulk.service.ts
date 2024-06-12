import { EventsService } from '@121-service/src/events/events.service';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { LatestMessageEntity } from '@121-service/src/notifications/latest-message.entity';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/message-job.dto';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { QueueMessageService } from '@121-service/src/notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-request.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { MessageSizeType as MessageSizeTypeDto } from '@121-service/src/registration/dto/message-size-type.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import {
  ScopedQueryBuilder,
  ScopedRepository,
} from '@121-service/src/scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, In, Not, Repository } from 'typeorm';

@Injectable()
export class RegistrationsBulkService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(LatestMessageEntity)
  private readonly latestMessageRepository: Repository<LatestMessageEntity>;
  // Even though this is related to the registration entity, it is not scoped since we never get/update this in a direct call
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepository: Repository<WhatsappPendingMessageEntity>;

  public constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly azureLogService: AzureLogService,
    private readonly queueMessageService: QueueMessageService,
    private readonly eventsService: EventsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(SafaricomRequestEntity))
    private readonly safaricomRequestScopedRepository: ScopedRepository<SafaricomRequestEntity>,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepo: ScopedRepository<IntersolveVoucherEntity>,
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private readonly twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private readonly registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
    @Inject(getScopedRepositoryProviderName(NoteEntity))
    private readonly noteScopedRepository: ScopedRepository<NoteEntity>,
  ) {}

  public async patchRegistrationsStatus(
    paginateQuery: PaginateQuery,
    programId: number,
    registrationStatus: RegistrationStatusEnum,
    dryRun: boolean,
    message?: string,
    messageTemplateKey?: string,
    messageContentType?: MessageContentType,
  ): Promise<BulkActionResultDto> {
    const includeSendingMessage = !!message || !!messageTemplateKey;
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        message,
        messageTemplateKey,
      );
    paginateQuery = this.setQueryPropertiesBulkAction(
      paginateQuery,
      false,
      includeSendingMessage,
      true,
      usedPlaceholders,
    );

    const allowedCurrentStatuses =
      this.getAllowedCurrentStatusesForNewStatus(registrationStatus);

    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getStatusUpdateBaseQuery(allowedCurrentStatuses, registrationStatus),
    );
    if (!dryRun) {
      this.updateRegistrationStatusBatchFilter(
        paginateQuery,
        programId,
        registrationStatus,
        usedPlaceholders,
        allowedCurrentStatuses,
        message,
        messageTemplateKey,
        messageContentType,
      ).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    // Get the refrenceIds for the update seperately as running a query with no limit is slower
    // so you show the result of the applicable registrations earlier
    return resultDto;
  }

  public async deleteRegistrations(
    paginateQuery: PaginateQuery,
    programId: number,
    dryRun: boolean,
  ): Promise<BulkActionResultDto> {
    paginateQuery = this.setQueryPropertiesBulkAction(
      paginateQuery,
      false,
      false,
      true,
    );

    const allowedCurrentStatuses = this.getAllowedCurrentStatusesForNewStatus(
      RegistrationStatusEnum.deleted,
    );

    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getStatusUpdateBaseQuery(allowedCurrentStatuses),
    );
    if (!dryRun) {
      this.deleteBatch(paginateQuery, programId, allowedCurrentStatuses).catch(
        (error) => {
          this.azureLogService.logError(error, true);
        },
      );
    }
    return resultDto;
  }

  public async postMessages(
    paginateQuery: PaginateQuery,
    programId: number,
    message: string,
    messageTemplateKey: string,
    dryRun: boolean,
  ): Promise<BulkActionResultDto> {
    if (messageTemplateKey) {
      await this.validateTemplateKey(programId, messageTemplateKey);
    }
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        message,
        messageTemplateKey,
      );
    paginateQuery = this.setQueryPropertiesBulkAction(
      paginateQuery,
      false,
      true,
      false,
      usedPlaceholders,
    );
    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getBaseQuery(),
    );

    if (!dryRun) {
      const chunkSize = 10000;
      this.sendMessagesBatch(
        paginateQuery,
        programId,
        message,
        chunkSize,
        resultDto.applicableCount,
        usedPlaceholders,
        messageTemplateKey,
      ).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    return resultDto;
  }

  private async sendMessagesBatch(
    paginateQuery: PaginateQuery,
    programId: number,
    message: string,
    chunkSize: number,
    bulkSize: number,
    usedPlaceholders: string[],
    messageTemplateKey: string,
  ): Promise<void> {
    paginateQuery.limit = chunkSize;
    const registrationsMetadata =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        // TODO: Make this dynamic / a permission check
        true,
        false,
        this.getBaseQuery(),
      );

    for (let i = 0; i < registrationsMetadata.meta.totalPages; i++) {
      paginateQuery.page = i + 1;
      const registrationsForUpdate =
        await this.registrationsPaginationService.getPaginate(
          paginateQuery,
          programId,
          // TODO: Make this dynamic / a permission check
          true,
          false,
          this.getBaseQuery(),
        );
      this.sendCustomTextMessagePerChunk(
        registrationsForUpdate.data,
        message,
        bulkSize,
        usedPlaceholders,
        messageTemplateKey,
      ).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
  }

  public async getBulkActionResult(
    paginateQuery: PaginateQuery,
    programId: number,
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
  ): Promise<BulkActionResultDto> {
    const selectedRegistrations =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        true,
        false,
      );

    const applicableRegistrations =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        true,
        false,
        queryBuilder,
      );

    return {
      totalFilterCount: selectedRegistrations.meta.totalItems,
      applicableCount: applicableRegistrations.meta.totalItems,
      nonApplicableCount:
        selectedRegistrations.meta.totalItems -
        applicableRegistrations.meta.totalItems,
    };
  }

  public getBaseQuery(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({ status: Not(RegistrationStatusEnum.deleted) });
  }

  public setQueryPropertiesBulkAction(
    query: PaginateQuery,
    includePaymentAttributes = false,
    includeSendMessageProperties = false,
    includeStatusChangeProperties = false,
    usedPlaceholders?: string[],
    selectColumns: string[] = [],
  ): PaginateQuery {
    query.select = ['referenceId', 'programId', ...selectColumns];
    if (includePaymentAttributes) {
      query.select.push('paymentAmountMultiplier');
      query.select.push('financialServiceProvider');
    }
    if (includeSendMessageProperties) {
      query.select.push('id');
      query.select.push('preferredLanguage');
      query.select.push('whatsappPhoneNumber');
      query.select.push('phoneNumber');
    }
    if (usedPlaceholders && usedPlaceholders?.length > 0) {
      query.select = [...query.select, ...usedPlaceholders];
    }
    if (includeStatusChangeProperties) {
      query.select.push('id');
      query.select.push('status');
    }
    // Remove duplicates from select
    query.select = [...new Set(query.select)];
    query.page = undefined;
    return query;
  }

  public getRegistrationsForPaymentQuery(
    referenceIds: string[],
    dataFieldNames: string[],
  ) {
    return this.setQueryPropertiesBulkAction(
      {
        path: '',
        filter: { referenceId: `$in:${referenceIds.join(',')}` },
      },
      true,
      false,
      false,
      [],
      dataFieldNames,
    );
  }
  y;
  private getStatusUpdateBaseQuery(
    allowedCurrentStatuses: RegistrationStatusEnum[],
    registrationStatus?: RegistrationStatusEnum,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    let query = this.getBaseQuery().andWhere({
      status: In(allowedCurrentStatuses),
    });
    if (registrationStatus === RegistrationStatusEnum.included) {
      // this prohibits going from completed to included if 0 remaining payments
      query = query.andWhere(
        '(registration."paymentCountRemaining" > 0 OR registration."paymentCountRemaining" IS NULL)',
      );
    }
    return query;
  }

  private async updateRegistrationStatusBatchFilter(
    paginateQuery: PaginateQuery,
    programId: number,
    registrationStatus: RegistrationStatusEnum,
    usedPlaceholders: string[],
    allowedCurrentStatuses: RegistrationStatusEnum[],
    message?: string,
    messageTemplateKey?: string,
    messageContentType?: MessageContentType,
  ): Promise<void> {
    const chunkSize = 10000;
    paginateQuery.limit = chunkSize;
    const registrationForUpdateMeta =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        true,
        false,
        this.getStatusUpdateBaseQuery(
          allowedCurrentStatuses,
          registrationStatus,
        ),
      );

    for (let i = 0; i < registrationForUpdateMeta.meta.totalPages; i++) {
      const registrationsForUpdate =
        await this.registrationsPaginationService.getPaginate(
          paginateQuery,
          programId,
          true,
          false,
          this.getStatusUpdateBaseQuery(
            allowedCurrentStatuses,
            registrationStatus,
          ),
        );
      await this.updateRegistrationStatusChunk(
        registrationsForUpdate.data,
        registrationStatus,
        {
          message,
          messageTemplateKey,
          messageContentType,
          bulkSize: registrationsForUpdate.meta.totalItems,
        },
        usedPlaceholders,
      );
    }
  }

  private async updateRegistrationStatusChunk(
    filteredRegistrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'],
    registrationStatus: RegistrationStatusEnum,
    messageSizeType?: Partial<MessageSizeTypeDto>,
    usedPlaceholders?: string[],
  ): Promise<void> {
    const filteredRegistrationsIds = filteredRegistrations.map((r) => r.id);

    await this.registrationScopedRepository.updateUnscoped(
      {
        id: In(filteredRegistrationsIds),
      },
      { registrationStatus },
    );

    const registrationsAfterUpdate =
      await this.registrationViewScopedRepository.find({
        where: { id: In(filteredRegistrationsIds) },
        select: ['id', 'status'],
        order: {
          id: 'ASC',
        },
        loadEagerRelations: false,
      });

    const statusKey: keyof RegistrationViewEntity = 'status';
    await this.eventsService.log(
      filteredRegistrations,
      registrationsAfterUpdate,
      { registrationAttributes: [statusKey] },
    );
    for (const registration of filteredRegistrations) {
      if (
        (messageSizeType?.message || messageSizeType?.messageTemplateKey) &&
        registration
      ) {
        const messageProcessType =
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric;
        const placeholderData = {};
        if (usedPlaceholders && usedPlaceholders.length) {
          for (const placeholder of usedPlaceholders) {
            placeholderData[placeholder] = registration[placeholder];
          }
        }
        try {
          const { message, messageTemplateKey, messageContentType, bulkSize } =
            messageSizeType;
          await this.queueMessageService.addMessageToQueue({
            ...messageSizeType,
            registration,
            message,
            messageTemplateKey,
            messageContentType: messageContentType ?? MessageContentType.custom,
            messageProcessType,
            customData: { placeholderData },
            bulksize: bulkSize,
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            throw error;
          } else {
            this.azureLogService.logError(error, true);
          }
        }
      }
    }
  }

  private async deleteBatch(
    paginateQuery: PaginateQuery,
    programId: number,
    allowedCurrentStatuses: RegistrationStatusEnum[],
  ): Promise<void> {
    const chunkSize = 10000;
    paginateQuery.limit = chunkSize;
    const registrationForDeleteMeta =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        true,
        false,
        this.getStatusUpdateBaseQuery(
          allowedCurrentStatuses,
          RegistrationStatusEnum.deleted,
        ),
      );

    for (let i = 0; i < registrationForDeleteMeta.meta.totalPages; i++) {
      const registrationsForDelete =
        await this.registrationsPaginationService.getPaginate(
          paginateQuery,
          programId,
          true,
          false,
          this.getStatusUpdateBaseQuery(
            allowedCurrentStatuses,
            RegistrationStatusEnum.deleted,
          ),
        );

      await this.deleteRegistrationsChunk(registrationsForDelete.data);
    }
  }

  private async deleteRegistrationsChunk(
    registrationsForDelete: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'],
  ): Promise<void> {
    await this.updateRegistrationStatusChunk(
      registrationsForDelete,
      RegistrationStatusEnum.deleted,
    );
    const registrationsIds = registrationsForDelete.map((r) => r.id);

    await this.noteScopedRepository.deleteUnscoped({
      registrationId: In(registrationsIds),
    });

    await this.registrationDataScopedRepository.deleteUnscoped({
      registrationId: In(registrationsIds),
    });

    await this.latestMessageRepository.delete({
      registrationId: In(registrationsIds),
    });
    await this.twilioMessageScopedRepository.deleteUnscoped({
      registrationId: In(registrationsIds),
    });
    await this.whatsappPendingMessageRepository.delete({
      registrationId: In(registrationsIds),
    });
    await this.tryWhatsappRepository.delete({
      registrationId: In(registrationsIds),
    });
    await this.registrationScopedRepository.updateUnscoped(
      { id: In(registrationsIds) },
      { phoneNumber: null },
    );

    const voucherImageQueryResult = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.images', 'images')
      .leftJoin('images.voucher', 'voucher')
      .select('voucher.id as "voucherId"')
      .andWhere({
        id: In(registrationsIds),
      })
      .getRawMany();
    const voucherIds = voucherImageQueryResult.map((v) => v.voucherId);
    await this.intersolveVoucherScopedRepo.updateUnscoped(
      { id: In(voucherIds) },
      { whatsappPhoneNumber: null },
    );

    const transactionIdsQueryResult = await this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.transactions', 'transactions')
      .select('transactions.id as "transactionId"')
      .andWhere({
        id: In(registrationsIds),
      })
      .getRawMany();
    const transactionIds = transactionIdsQueryResult.map(
      (t) => t.transactionId,
    );
    const transactionsRelatedToSafaricomQueryResult =
      await this.safaricomRequestScopedRepository
        .createQueryBuilder('safaricom_request')
        .select('"transactionId"')
        .andWhere({
          transactionId: In(transactionIds),
        })
        .getRawMany();
    const transactionIdsRelatedToSafaricom =
      transactionsRelatedToSafaricomQueryResult.map((t) => t.transactionId);

    await this.safaricomRequestScopedRepository
      .createQueryBuilder('safaricom_request')
      .delete()
      .from(SafaricomRequestEntity)
      .where('transactionId IN  (:...transactionIds)', {
        transactionIds: transactionIds,
      })
      .execute();

    await this.transactionScopedRepository.updateUnscoped(
      { id: In(transactionIdsRelatedToSafaricom) },
      { customData: JSON.parse('{}') },
    );
  }

  private async sendCustomTextMessagePerChunk(
    registrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'],
    message: string,
    bulksize: number,
    usedPlaceholders: string[],
    messageTemplateKey?: string,
  ): Promise<void> {
    for (const registration of registrations) {
      const placeholderData = {};
      for (const placeholder of usedPlaceholders) {
        placeholderData[placeholder] = registration[placeholder];
      }
      await this.queueMessageService.addMessageToQueue({
        registration,
        message,
        messageTemplateKey,
        messageContentType: MessageContentType.custom,
        messageProcessType:
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        customData: { placeholderData },
        bulksize,
      });
    }
  }

  private getAllowedCurrentStatusesForNewStatus(
    newStatus: RegistrationStatusEnum,
  ): RegistrationStatusEnum[] {
    const allStatuses = Object.values(RegistrationStatusEnum);
    return allStatuses.filter((currentStatus) =>
      this.registrationsService.canChangeStatus(currentStatus, newStatus),
    );
  }

  private async validateTemplateKey(
    programId: number,
    messageTemplateKey: string,
  ): Promise<void> {
    const template = await this.messageTemplateRepository.findOne({
      where: {
        programId: Equal(programId),
        type: Equal(messageTemplateKey),
      },
    });
    if (!template) {
      throw new HttpException(
        `Message template with key ${messageTemplateKey} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
