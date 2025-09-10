import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, In, Not, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { MessageProcessTypeExtension } from '@121-service/src/notifications/dto/message-job.dto';
import { LatestMessageEntity } from '@121-service/src/notifications/entities/latest-message.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/entities/twilio.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { TryWhatsappEntity } from '@121-service/src/notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '@121-service/src/notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { BulkActionResultDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { StatusChangeHelper } from '@121-service/src/registration/helpers/status-change.helper';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import {
  ScopedQueryBuilder,
  ScopedRepository,
} from '@121-service/src/scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class RegistrationsBulkService {
  @InjectRepository(MessageTemplateEntity)
  private readonly messageTemplateRepository: Repository<MessageTemplateEntity>;
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(LatestMessageEntity)
  private readonly latestMessageRepository: Repository<LatestMessageEntity>;
  // Even though this is related to the registration entity, it is not scoped since we never get/update this in a direct call
  @InjectRepository(WhatsappPendingMessageEntity)
  private readonly whatsappPendingMessageRepository: Repository<WhatsappPendingMessageEntity>;

  public constructor(
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly azureLogService: AzureLogService,
    private readonly queueMessageService: MessageQueuesService,
    private readonly registrationEventsService: RegistrationEventsService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepo: ScopedRepository<IntersolveVoucherEntity>,
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private readonly twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    @Inject(getScopedRepositoryProviderName(NoteEntity))
    private readonly noteScopedRepository: ScopedRepository<NoteEntity>,
  ) {}

  public async patchRegistrationsStatus({
    paginateQuery,
    programId,
    registrationStatus,
    dryRun,
    userId,
    messageContentDetails,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    registrationStatus: RegistrationStatusEnum;
    dryRun: boolean;
    userId: number;
    messageContentDetails: MessageContentDetails;
    reason?: string;
  }): Promise<BulkActionResultDto> {
    const includeSendingMessage =
      !!messageContentDetails.message ||
      !!messageContentDetails.messageTemplateKey;
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        messageContentDetails.message,
        messageContentDetails.messageTemplateKey,
      );
    paginateQuery = this.setQueryPropertiesBulkAction({
      query: paginateQuery,
      includePaymentAttributes: false,
      includeSendMessageProperties: includeSendingMessage,
      includeStatusChangeProperties: true,
      usedPlaceholders,
    });

    const allowedCurrentStatuses =
      this.getAllowedCurrentStatusesForNewStatus(registrationStatus);

    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getStatusUpdateBaseQuery(allowedCurrentStatuses, registrationStatus),
    );
    if (!dryRun) {
      this.updateRegistrationStatusBatchFilter({
        paginateQuery,
        programId,
        registrationStatus,
        usedPlaceholders,
        allowedCurrentStatuses,
        userId,
        messageContentDetails,
        reason,
      }).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    // Get the refrenceIds for the update seperately as running a query with no limit is slower
    // so you show the result of the applicable registrations earlier
    return resultDto;
  }

  public async deleteRegistrations({
    paginateQuery,
    programId,
    dryRun,
    userId,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    dryRun: boolean;
    userId: number;
    reason: string;
  }): Promise<BulkActionResultDto> {
    paginateQuery = this.setQueryPropertiesBulkAction({
      query: paginateQuery,
      includePaymentAttributes: false,
      includeSendMessageProperties: false,
      includeStatusChangeProperties: true,
    });

    const allowedCurrentStatuses = this.getAllowedCurrentStatusesForNewStatus(
      RegistrationStatusEnum.deleted,
    );

    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getStatusUpdateBaseQuery(allowedCurrentStatuses),
    );
    if (!dryRun) {
      this.deleteBatch({
        paginateQuery,
        programId,
        allowedCurrentStatuses,
        userId,
        reason,
      }).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    return resultDto;
  }

  public async postMessages({
    paginateQuery,
    programId,
    message,
    messageTemplateKey,
    dryRun,
    userId,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    message: string;
    messageTemplateKey: string;
    dryRun: boolean;
    userId: number;
  }): Promise<BulkActionResultDto> {
    if (messageTemplateKey) {
      await this.validateTemplateKey(programId, messageTemplateKey);
    }
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        message,
        messageTemplateKey,
      );
    paginateQuery = this.setQueryPropertiesBulkAction({
      query: paginateQuery,
      includePaymentAttributes: false,
      includeSendMessageProperties: true,
      includeStatusChangeProperties: false,
      usedPlaceholders,
    });
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
        userId,
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
    userId: number,
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

    for (let i = 0; i < (registrationsMetadata.meta.totalPages ?? 0); i++) {
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
        userId,
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
      totalFilterCount: selectedRegistrations.meta.totalItems ?? 0,
      applicableCount: applicableRegistrations.meta.totalItems ?? 0,
      nonApplicableCount:
        (selectedRegistrations.meta.totalItems ?? 0) -
        (applicableRegistrations.meta.totalItems ?? 0),
    };
  }

  public getBaseQuery(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({ status: Not(RegistrationStatusEnum.deleted) });
  }

  public setQueryPropertiesBulkAction({
    query,
    includePaymentAttributes = false,
    includeSendMessageProperties = false,
    includeStatusChangeProperties = false,
    usedPlaceholders,
    selectColumns = [],
  }: {
    query: PaginateQuery;
    includePaymentAttributes?: boolean;
    includeSendMessageProperties?: boolean;
    includeStatusChangeProperties?: boolean;
    usedPlaceholders?: string[];
    selectColumns?: string[];
  }): PaginateQuery {
    query.select = [
      GenericRegistrationAttributes.referenceId,
      'programId',
      ...selectColumns,
    ];
    if (includePaymentAttributes) {
      query.select.push(GenericRegistrationAttributes.paymentAmountMultiplier);
      query.select.push('programFspConfigurationId');
      query.select.push(
        GenericRegistrationAttributes.programFspConfigurationName,
      );
      query.select.push('fspName');
    }
    if (includeSendMessageProperties) {
      query.select.push('id');
      query.select.push(GenericRegistrationAttributes.preferredLanguage);
      query.select.push(
        DefaultRegistrationDataAttributeNames.whatsappPhoneNumber,
      );
      query.select.push(GenericRegistrationAttributes.phoneNumber);
    }
    if (usedPlaceholders && usedPlaceholders?.length > 0) {
      query.select = [...query.select, ...usedPlaceholders];
    }
    if (includeStatusChangeProperties) {
      query.select.push('id');
      query.select.push(GenericRegistrationAttributes.status);
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
    return this.setQueryPropertiesBulkAction({
      query: {
        path: '',
        filter: { referenceId: `$in:${referenceIds.join(',')}` },
      },
      includePaymentAttributes: true,
      includeSendMessageProperties: false,
      includeStatusChangeProperties: false,
      usedPlaceholders: [],
      selectColumns: dataFieldNames,
    });
  }

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

  private async updateRegistrationStatusBatchFilter({
    paginateQuery,
    programId,
    registrationStatus,
    usedPlaceholders,
    allowedCurrentStatuses,
    userId,
    messageContentDetails,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    registrationStatus: RegistrationStatusEnum;
    usedPlaceholders: string[];
    allowedCurrentStatuses: RegistrationStatusEnum[];
    userId: number;
    messageContentDetails: MessageContentDetails;
    reason?: string;
  }): Promise<void> {
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

    for (let i = 0; i < (registrationForUpdateMeta.meta.totalPages ?? 0); i++) {
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
      await this.updateRegistrationStatusChunk({
        filteredRegistrations: registrationsForUpdate.data,
        userId,
        registrationStatus,
        messageContentDetails,
        bulkSize: registrationsForUpdate.meta.totalItems ?? 0,
        usedPlaceholders,
        reason,
      });
    }
  }

  private async updateRegistrationStatusChunk({
    filteredRegistrations,
    userId,
    registrationStatus,
    messageContentDetails,
    bulkSize,
    usedPlaceholders,
    reason,
  }: {
    filteredRegistrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'];
    userId: number;
    registrationStatus: RegistrationStatusEnum;
    messageContentDetails?: MessageContentDetails;
    bulkSize?: number;
    usedPlaceholders?: string[];
    reason?: string;
  }): Promise<void> {
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
    await this.registrationEventsService.createFromRegistrationViews(
      filteredRegistrations,
      registrationsAfterUpdate,
      { explicitRegistrationPropertyNames: [statusKey], reason },
    );
    for (const registration of filteredRegistrations) {
      if (
        (messageContentDetails?.message ||
          messageContentDetails?.messageTemplateKey) &&
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
          const { message, messageTemplateKey, messageContentType } =
            messageContentDetails;
          await this.queueMessageService.addMessageJob({
            ...messageContentDetails,
            bulksize: bulkSize,
            registration,
            message,
            messageTemplateKey,
            messageContentType: messageContentType ?? MessageContentType.custom,
            messageProcessType,
            customData: { placeholderData },
            userId,
          });
        } catch (error) {
          if (IS_DEVELOPMENT) {
            throw error;
          } else {
            this.azureLogService.logError(error, true);
          }
        }
      }
    }
  }

  private async deleteBatch({
    paginateQuery,
    programId,
    allowedCurrentStatuses,
    userId,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    allowedCurrentStatuses: RegistrationStatusEnum[];
    userId: number;
    reason: string;
  }): Promise<void> {
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

    for (let i = 0; i < (registrationForDeleteMeta.meta.totalPages ?? 0); i++) {
      const registrationPaginateObject =
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

      await this.deleteRegistrationsChunk({
        registrationsForDelete: registrationPaginateObject.data,
        userId,
        reason,
      });
    }
  }

  private async deleteRegistrationsChunk({
    registrationsForDelete,
    userId,
    reason,
  }: {
    registrationsForDelete: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'];
    userId: number;
    reason: string;
  }): Promise<void> {
    await this.updateRegistrationStatusChunk({
      filteredRegistrations: registrationsForDelete,
      userId,
      registrationStatus: RegistrationStatusEnum.deleted,
      reason,
    });
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
  }

  private async sendCustomTextMessagePerChunk(
    registrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'],
    message: string,
    bulksize: number,
    usedPlaceholders: string[],
    userId: number,
    messageTemplateKey?: string,
  ): Promise<void> {
    for (const registration of registrations) {
      const placeholderData = {};
      for (const placeholder of usedPlaceholders) {
        placeholderData[placeholder] = registration[placeholder];
      }
      await this.queueMessageService.addMessageJob({
        registration,
        message,
        messageTemplateKey,
        messageContentType: MessageContentType.custom,
        messageProcessType:
          MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        customData: { placeholderData },
        bulksize,
        userId,
      });
    }
  }

  private getAllowedCurrentStatusesForNewStatus(
    newStatus: RegistrationStatusEnum,
  ): RegistrationStatusEnum[] {
    const allStatuses = Object.values(RegistrationStatusEnum);
    return allStatuses.filter((currentStatus) =>
      StatusChangeHelper.isValidStatusChange(currentStatus, newStatus),
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
