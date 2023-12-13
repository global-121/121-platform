import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { And, In, IsNull, Not, Repository } from 'typeorm';
import { MessageContentType } from '../../notifications/enum/message-type.enum';
import { LatestMessageEntity } from '../../notifications/latest-message.entity';
import {
  MessageProcessType,
  MessageProcessTypeExtension,
} from '../../notifications/message-job.dto';
import { QueueMessageService } from '../../notifications/queue-message/queue-message.service';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { TryWhatsappEntity } from '../../notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '../../notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherEntity } from '../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '../../payments/fsp-integration/safaricom/safaricom-request.entity';
import { ImageCodeExportVouchersEntity } from '../../payments/imagecode/image-code-export-vouchers.entity';
import { PersonAffectedAppDataEntity } from '../../people-affected/person-affected-app-data.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { ScopedQueryBuilder, ScopedRepository } from '../../scoped.repository';
import { AzureLogService } from '../../shared/services/azure-log.service';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';
import { BulkActionResultDto } from '../dto/bulk-action-result.dto';
import { MessageSizeType as MessageSizeTypeDto } from '../dto/message-size-type.dto';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationDataEntity } from '../registration-data.entity';
import {
  RegistrationScopedRepository,
  RegistrationViewScopedRepository,
} from '../registration-scoped.repository';
import { RegistrationViewEntity } from '../registration-view.entity';
import { RegistrationsService } from '../registrations.service';
import { RegistrationsPaginationService } from './registrations-pagination.service';

@Injectable()
export class RegistrationsBulkService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(PersonAffectedAppDataEntity)
  private readonly personAffectedAppDataRepository: Repository<PersonAffectedAppDataEntity>;
  //  Even though this is related to the registration entity, it is not scoped since we never get/update this in a direct call
  @InjectRepository(TwilioMessageEntity)
  private readonly twilioMessageRepository: Repository<TwilioMessageEntity>;
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
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(SafaricomRequestEntity))
    private readonly safaricomRequestScopedRepository: ScopedRepository<SafaricomRequestEntity>,
    @Inject(getScopedRepositoryProviderName(ImageCodeExportVouchersEntity))
    private readonly imageCodeExportVouchersScopedRepo: ScopedRepository<ImageCodeExportVouchersEntity>,
    @Inject(getScopedRepositoryProviderName(IntersolveVoucherEntity))
    private readonly intersolveVoucherScopedRepo: ScopedRepository<IntersolveVoucherEntity>,
    @Inject(getScopedRepositoryProviderName(TwilioMessageEntity))
    private readonly twilioMessageScopedRepository: ScopedRepository<TwilioMessageEntity>,
    @Inject(getScopedRepositoryProviderName(RegistrationDataEntity))
    private readonly registrationDataScopedRepository: ScopedRepository<RegistrationDataEntity>,
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
    // Overwrite the default select, as we only need the referenceId
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        message,
        messageTemplateKey,
      );
    paginateQuery = this.setQueryPropertiesBulkAction(
      paginateQuery,
      false,
      false,
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
        message,
        messageTemplateKey,
        messageContentType,
        this.getStatusUpdateBaseQuery(
          allowedCurrentStatuses,
          registrationStatus,
        ),
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
    paginateQuery = this.setQueryPropertiesBulkAction(paginateQuery);

    const allowedCurrentStatuses = this.getAllowedCurrentStatusesForNewStatus(
      RegistrationStatusEnum.deleted,
    );

    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getStatusUpdateBaseQuery(allowedCurrentStatuses),
    );
    if (!dryRun) {
      const registrationForDelete =
        await this.registrationsPaginationService.getPaginate(
          paginateQuery,
          programId,
          false,
          true,
          this.getStatusUpdateBaseQuery(allowedCurrentStatuses),
        );
      this.deleteBatch(registrationForDelete.data).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    return resultDto;
  }

  public async postMessages(
    paginateQuery: PaginateQuery,
    programId: number,
    message: string,
    dryRun: boolean,
  ): Promise<BulkActionResultDto> {
    const usedPlaceholders =
      await this.queueMessageService.getPlaceholdersInMessageText(
        programId,
        message,
      );
    paginateQuery = this.setQueryPropertiesBulkAction(
      paginateQuery,
      false,
      true,
      usedPlaceholders,
    );
    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getCustomMessageBaseQuery(),
    );

    if (!dryRun) {
      const chunkSize = 10000;
      this.sendMessagesChunked(
        paginateQuery,
        programId,
        message,
        chunkSize,
        resultDto.applicableCount,
        usedPlaceholders,
      ).catch((error) => {
        this.azureLogService.logError(error, true);
      });
    }
    return resultDto;
  }

  private async sendMessagesChunked(
    paginateQuery: PaginateQuery,
    programId: number,
    message: string,
    chunkSize: number,
    bulkSize: number,
    usedPlaceholders: string[],
  ): Promise<void> {
    paginateQuery.limit = chunkSize;
    const registrationsMetadata =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        // TODO: Make this dynamic / a permission check
        true,
        false,
        this.getCustomMessageBaseQuery(),
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
          this.getCustomMessageBaseQuery(),
        );
      this.sendCustomTextMessage(
        registrationsForUpdate.data,
        message,
        bulkSize,
        usedPlaceholders,
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
    includePaymentMultiplier = false,
    includeSendMessageProperties = false,
    usedPlaceholders?: string[],
  ): PaginateQuery {
    query.select = ['referenceId'];
    if (includePaymentMultiplier) {
      query.select.push('paymentAmountMultiplier');
    }
    if (includeSendMessageProperties) {
      query.select.push('id');
      query.select.push('preferredLanguage');
      query.select.push('whatsappPhoneNumber');
      query.select.push('phoneNumber');
    }
    if (usedPlaceholders?.length > 0) {
      query.select = [...query.select, ...usedPlaceholders];
    }
    query.page = null;
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

  private getCustomMessageBaseQuery(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.getBaseQuery().andWhere({
      phoneNumber: And(Not(IsNull()), Not('')),
    });
  }

  private async updateRegistrationStatusBatchFilter(
    query: PaginateQuery,
    programId: number,
    registrationStatus: RegistrationStatusEnum,
    usedPlaceholders: string[],
    message?: string,
    messageTemplateKey?: string,
    messageContentType?: MessageContentType,
    queryBuilder?: ScopedQueryBuilder<RegistrationViewEntity>,
  ): Promise<void> {
    const registrationForUpdate =
      await this.registrationsPaginationService.getPaginate(
        query,
        programId,
        true,
        true,
        queryBuilder,
      );

    await this.updateRegistrationStatusBatch(
      registrationForUpdate.data,
      registrationStatus,
      {
        message,
        messageTemplateKey,
        messageContentType,
        bulkSize: registrationForUpdate.meta.totalItems,
      },
      usedPlaceholders,
    );
  }

  private async updateRegistrationStatusBatch(
    registrations: RegistrationViewEntity[],
    registrationStatus: RegistrationStatusEnum,
    messageSizeType?: MessageSizeTypeDto,
    usedPlaceholders?: string[],
  ): Promise<void> {
    let programId;
    let program;
    for (const registration of registrations) {
      const updatedRegistration =
        await this.registrationsService.setRegistrationStatus(
          registration.referenceId,
          registrationStatus,
        );
      if (
        (messageSizeType?.message || messageSizeType?.messageTemplateKey) &&
        updatedRegistration
      ) {
        if (updatedRegistration.programId !== programId) {
          // avoid a query per PA if not necessary
          programId = updatedRegistration.programId;
          program = await this.programRepository.findOne({
            where: { id: programId },
          });
        }
        const messageProcessType =
          registrationStatus === RegistrationStatusEnum.invited &&
          program.tryWhatsAppFirst
            ? MessageProcessType.tryWhatsapp
            : MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric;
        const placeholderData = {};
        if (usedPlaceholders.length) {
          for (const placeholder of usedPlaceholders) {
            placeholderData[placeholder] = registration[placeholder];
          }
        }
        try {
          await this.queueMessageService.addMessageToQueue(
            updatedRegistration,
            messageSizeType.message,
            messageSizeType.messageTemplateKey,
            messageSizeType.messageContentType,
            messageProcessType,
            null,
            { placeholderData },
            messageSizeType.bulkSize,
          );
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
    registrations: RegistrationViewEntity[],
  ): Promise<void> {
    // Do this first, so that error is already thrown if a PA cannot be changed to deleted, before removing any data below
    await this.checkAllowedStatusChangeOrThrow(
      registrations.map((r) => r.referenceId),
      RegistrationStatusEnum.deleted,
    );
    await this.updateRegistrationStatusBatch(
      registrations,
      RegistrationStatusEnum.deleted,
    );

    for await (const registrationViewEntity of registrations) {
      const registration =
        await this.registrationsService.getRegistrationFromReferenceId(
          registrationViewEntity.referenceId,
          ['user'],
        );

      // Delete all data for this registration
      await this.registrationDataScopedRepository.deleteUnscoped({
        registrationId: registration.id,
      });
      if (registration.user) {
        await this.personAffectedAppDataRepository.delete({
          user: { id: registration.user.id },
        });
      }
      await this.twilioMessageScopedRepository.deleteUnscoped({
        registrationId: registration.id,
      });
      await this.latestMessageRepository.delete({
        registrationId: registration.id,
      });
      await this.twilioMessageRepository.delete({
        registrationId: registration.id,
      });
      await this.whatsappPendingMessageRepository.delete({
        registrationId: registration.id,
      });
      await this.tryWhatsappRepository.delete({
        registrationId: registration.id,
      });

      // anonymize some data for this registration
      registration.phoneNumber = null;
      await this.registrationScopedRepository.save(registration);

      // FSP-specific
      // intersolve-voucher
      const voucherImages = await this.imageCodeExportVouchersScopedRepo.find({
        where: { registrationId: registration.id },
        relations: ['voucher'],
      });
      const vouchersToUpdate = [];
      for await (const voucherImage of voucherImages) {
        const voucher = await this.intersolveVoucherScopedRepo.findOne({
          where: { id: voucherImage.voucher.id },
        });
        voucher.whatsappPhoneNumber = null;
        vouchersToUpdate.push(voucher);
      }
      await this.intersolveVoucherScopedRepo.save(vouchersToUpdate);
      //safaricom
      const safaricomRequests =
        await this.safaricomRequestScopedRepository.find({
          where: { transaction: { registration: { id: registration.id } } },
          relations: ['transaction', 'transaction.registration'],
        });
      const requestsToUpdate = [];
      for (const request of safaricomRequests) {
        request.requestResult = JSON.parse(
          JSON.stringify(request.requestResult).replace(request.partyB, ''),
        );
        request.paymentResult = JSON.parse(
          JSON.stringify(request.paymentResult).replace(request.partyB, ''),
        );
        request.transaction.customData = JSON.parse(
          JSON.stringify(request.transaction.customData).replace(
            request.partyB,
            '',
          ),
        );
        request.partyB = '';
        requestsToUpdate.push(request);
      }
      await this.safaricomRequestScopedRepository.save(requestsToUpdate);
      // TODO: at_notification + belcash_request
    }
  }

  private async sendCustomTextMessage(
    registrations: RegistrationViewEntity[],
    message: string,
    bulkSize: number,
    usedPlaceholders: string[],
  ): Promise<void> {
    for (const registration of registrations) {
      const placeholderData = {};
      for (const placeholder of usedPlaceholders) {
        placeholderData[placeholder] = registration[placeholder];
      }
      await this.queueMessageService.addMessageToQueue(
        registration,
        message,
        null,
        MessageContentType.custom,
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        null,
        { placeholderData },
        bulkSize,
      );
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

  private async checkAllowedStatusChangeOrThrow(
    referenceIds: string[],
    registrationStatus: RegistrationStatusEnum,
  ): Promise<void> {
    const errors = [];
    for (const referenceId of referenceIds) {
      const registrationToUpdate =
        await this.registrationScopedRepository.findOne({
          where: { referenceId: referenceId },
        });
      if (!registrationToUpdate) {
        errors.push(`Registration '${referenceId}' is not found`);
      } else if (
        !this.registrationsService.canChangeStatus(
          registrationToUpdate.registrationStatus,
          registrationStatus,
        )
      ) {
        errors.push(
          `Registration '${referenceId}' has status '${registrationToUpdate.registrationStatus}' which cannot be changed to ${registrationStatus}`,
        );
      }
    }
    if (errors.length > 0) {
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
  }
}
