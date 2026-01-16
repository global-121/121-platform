import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import chunk from 'lodash/chunk';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, In, Repository } from 'typeorm';

import { IntersolveVoucherEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/entities/intersolve-voucher.entity';
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
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepo: ScopedRepository<IntersolveVoucherEntity>,
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private readonly twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    @Inject(getScopedRepositoryProviderName(NoteEntity))
    private readonly noteScopedRepository: ScopedRepository<NoteEntity>,
  ) {}

  public async updateRegistrationStatusOrDryRun({
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
    const allowedCurrentStatuses =
      this.getAllowedCurrentStatusesForNewStatus(registrationStatus);

    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getStatusUpdateBaseQuery(allowedCurrentStatuses, registrationStatus),
    );
    if (!dryRun) {
      this.applyRegistrationStatusUpdate({
        paginateQuery,
        programId,
        registrationStatus,
        allowedCurrentStatuses,
        userId,
        messageContentDetails,
        reason,
      }).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    // Get the referenceIds for the update separately as running a query with no limit is slower
    // so you show the result of the applicable registrations earlier
    return resultDto;
  }

  public async deleteRegistrations({
    paginateQuery,
    programId,
    dryRun,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    dryRun: boolean;
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
        reason,
      }).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    return resultDto;
  }

  public async sendMessagesOrDryRun(
    paginateQuery: PaginateQuery,
    programId: number,
    message: string,
    messageTemplateKey: string,
    dryRun: boolean,
    userId: number,
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
      this.applySendMessages(
        paginateQuery,
        programId,
        message,
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

  private async applySendMessages(
    paginateQuery: PaginateQuery,
    programId: number,
    message: string,
    bulkSize: number,
    usedPlaceholders: string[],
    messageTemplateKey: string,
    userId: number,
  ): Promise<void> {
    const messageContentDetails: MessageContentDetails = {
      message,
      messageTemplateKey,
      messageContentType: MessageContentType.custom,
    };

    const registrationsForUpdate =
      await this.registrationsPaginationService.getRegistrationViewsNoLimit({
        programId,
        paginateQuery,
        queryBuilder: this.getBaseQuery(),
      });

    this.sendMessagesPerChunk({
      registrations: registrationsForUpdate,
      messageContentDetails,
      bulksize: bulkSize,
      usedPlaceholders,
      userId,
    }).catch((error) => {
      this.azureLogService.logError(error, true);
    });
  }

  public async getBulkActionResult(
    paginateQuery: PaginateQuery,
    programId: number,
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
  ): Promise<BulkActionResultDto> {
    // Set limit to 1 to optimize query for getting the meta data only
    const paginateQueryLimit1 = { ...paginateQuery, limit: 1 };
    const selectedRegistrations =
      await this.registrationsPaginationService.getPaginate({
        query: paginateQueryLimit1,
        programId,
        hasPersonalReadPermission: true,
        noLimit: false,
      });

    const applicableRegistrations =
      await this.registrationsPaginationService.getPaginate({
        query: paginateQueryLimit1,
        programId,
        hasPersonalReadPermission: true,
        noLimit: false,
        queryBuilder,
      });

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
      .andWhere('registration.status IS DISTINCT FROM :deletedStatus', {
        deletedStatus: RegistrationStatusEnum.deleted, // The not opereator does not work with null values so we use IS DISTINCT FROM
      });
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

  private async applyRegistrationStatusUpdate({
    paginateQuery,
    programId,
    registrationStatus,
    allowedCurrentStatuses,
    userId,
    messageContentDetails,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    registrationStatus: RegistrationStatusEnum;
    allowedCurrentStatuses: RegistrationStatusEnum[];
    userId: number;
    messageContentDetails: MessageContentDetails;
    reason?: string;
  }): Promise<void> {
    const referenceIdsForWhichStatusChangeIsApllicable =
      await this.getReferenceIdsForWhichStatusChangeIsApplicable(
        programId,
        allowedCurrentStatuses,
        registrationStatus,
        paginateQuery,
      );

    await this.applyRegistrationStatusChangeAndSendMessageByReferenceIds({
      referenceIds: referenceIdsForWhichStatusChangeIsApllicable,
      programId,
      registrationStatus,
      userId,
      messageContentDetails,
      reason,
    });
  }

  public async applyRegistrationStatusChangeAndSendMessageByReferenceIds({
    referenceIds,
    programId,
    registrationStatus,
    userId,
    messageContentDetails,
    reason,
  }: {
    referenceIds: string[];
    programId: number;
    registrationStatus: RegistrationStatusEnum;
    userId: number;
    messageContentDetails: MessageContentDetails;
    reason?: string;
  }): Promise<void> {
    await this.applyRegistrationStatusChangeByReferenceIds({
      referenceIds,
      programId,
      registrationStatus,
      reason,
    });

    const includeSendingMessage =
      !!messageContentDetails.message ||
      !!messageContentDetails.messageTemplateKey;

    if (includeSendingMessage) {
      await this.sendMessagesByReferenceIds({
        referenceIds,
        programId,
        userId,
        messageContentDetails,
      });
    }
  }

  private async applyRegistrationStatusChangeByReferenceIds({
    referenceIds,
    programId,
    registrationStatus,
    reason,
  }: {
    referenceIds: string[];
    programId: number;
    registrationStatus: RegistrationStatusEnum;
    reason?: string;
  }): Promise<void> {
    const idColumn: keyof RegistrationViewEntity = 'id';
    const selectedColumns = [
      GenericRegistrationAttributes.referenceId,
      idColumn,
      GenericRegistrationAttributes.status,
    ];
    const registrationsForUpdate =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        { programId, referenceIds, select: selectedColumns },
      );

    const chunks = chunk(registrationsForUpdate, 10000);

    for (const registrationChunk of chunks) {
      await this.updateRegistrationStatusPerChunk({
        filteredRegistrations: registrationChunk,
        registrationStatus,
        reason,
      });
    }
  }

  private async sendMessagesByReferenceIds({
    referenceIds,
    programId,
    userId,
    messageContentDetails,
  }: {
    referenceIds: string[];
    programId: number;
    userId: number;
    messageContentDetails: MessageContentDetails;
  }): Promise<void> {
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        messageContentDetails.message,
        messageContentDetails.messageTemplateKey,
      );

    const idColumn: keyof RegistrationViewEntity = 'id';
    const selectedColumns = [
      ...usedPlaceholders,
      GenericRegistrationAttributes.referenceId,
      idColumn,
    ];

    selectedColumns.push(GenericRegistrationAttributes.preferredLanguage);
    selectedColumns.push(
      DefaultRegistrationDataAttributeNames.whatsappPhoneNumber,
    );
    selectedColumns.push(GenericRegistrationAttributes.phoneNumber);

    const registrationsToSendMessageTo =
      await this.registrationsPaginationService.getRegistrationViewsByReferenceIds(
        { programId, referenceIds, select: selectedColumns },
      );

    const chunks = chunk(registrationsToSendMessageTo, 10000);

    for (const registrationChunk of chunks) {
      await this.sendMessagesPerChunk({
        registrations: registrationChunk,
        userId,
        bulksize: registrationChunk.length,
        usedPlaceholders,
        messageContentDetails,
      });
    }
  }

  private async getReferenceIdsForWhichStatusChangeIsApplicable(
    programId: number,
    allowedCurrentStatuses: RegistrationStatusEnum[],
    newStatus: RegistrationStatusEnum,
    paginateQuery: PaginateQuery,
  ): Promise<string[]> {
    paginateQuery.select = [GenericRegistrationAttributes.referenceId];

    const queryBuilder = this.getStatusUpdateBaseQuery(
      allowedCurrentStatuses,
      newStatus,
    );
    const data =
      await this.registrationsPaginationService.getRegistrationViewsNoLimit({
        programId,
        paginateQuery,
        queryBuilder,
      });

    return data.map((r) => r.referenceId);
  }

  private async updateRegistrationStatusPerChunk({
    filteredRegistrations,
    registrationStatus,
    reason,
  }: {
    filteredRegistrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'];
    registrationStatus: RegistrationStatusEnum;
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
  }

  private async deleteBatch({
    paginateQuery,
    programId,
    allowedCurrentStatuses,
    reason,
  }: {
    paginateQuery: PaginateQuery;
    programId: number;
    allowedCurrentStatuses: RegistrationStatusEnum[];
    reason: string;
  }): Promise<void> {
    const chunkSize = 10000;
    const paginateQueryWithChunkSize = { ...paginateQuery, limit: chunkSize };

    const registrationForDeleteMeta =
      await this.registrationsPaginationService.getPaginate({
        query: paginateQueryWithChunkSize,
        programId,
        hasPersonalReadPermission: true,
        noLimit: false,
        queryBuilder: this.getStatusUpdateBaseQuery(
          allowedCurrentStatuses,
          RegistrationStatusEnum.deleted,
        ),
      });

    for (let i = 0; i < (registrationForDeleteMeta.meta.totalPages ?? 0); i++) {
      const registrationPaginateObject =
        await this.registrationsPaginationService.getPaginate({
          query: paginateQueryWithChunkSize,
          programId,
          hasPersonalReadPermission: true,
          noLimit: false,
          queryBuilder: this.getStatusUpdateBaseQuery(
            allowedCurrentStatuses,
            RegistrationStatusEnum.deleted,
          ),
        });

      await this.deleteRegistrationsChunk({
        registrationsForDelete: registrationPaginateObject.data,
        reason,
      });
    }
  }

  private async deleteRegistrationsChunk({
    registrationsForDelete,
    reason,
  }: {
    registrationsForDelete: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'];
    reason: string;
  }): Promise<void> {
    await this.updateRegistrationStatusPerChunk({
      filteredRegistrations: registrationsForDelete,
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

  private async sendMessagesPerChunk({
    registrations,
    messageContentDetails,
    bulksize,
    usedPlaceholders,
    userId,
  }: {
    registrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'];
    messageContentDetails: MessageContentDetails;
    bulksize: number;
    usedPlaceholders: string[];
    userId: number;
  }): Promise<void> {
    for (const registration of registrations) {
      const placeholderData = {};
      for (const placeholder of usedPlaceholders) {
        placeholderData[placeholder] = registration[placeholder];
      }
      await this.queueMessageService.addMessageJob({
        registration,
        message: messageContentDetails.message,
        messageTemplateKey: messageContentDetails.messageTemplateKey,
        messageContentType: messageContentDetails.messageContentType!, // already validated to be present
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
