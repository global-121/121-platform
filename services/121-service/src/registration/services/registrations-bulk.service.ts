import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { And, In, IsNull, Not, Repository } from 'typeorm';
import { MessageContentType } from '../../notifications/enum/message-type.enum';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { TryWhatsappEntity } from '../../notifications/whatsapp/try-whatsapp.entity';
import { WhatsappPendingMessageEntity } from '../../notifications/whatsapp/whatsapp-pending-message.entity';
import { IntersolveVoucherEntity } from '../../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { SafaricomRequestEntity } from '../../payments/fsp-integration/safaricom/safaricom-request.entity';
import { ImageCodeExportVouchersEntity } from '../../payments/imagecode/image-code-export-vouchers.entity';
import { PersonAffectedAppDataEntity } from '../../people-affected/person-affected-app-data.entity';
import { ProgramEntity } from '../../programs/program.entity';
import { AzureLogService } from '../../shared/services/azure-log.service';
import { BulkActionResultDto } from '../dto/bulk-action-result.dto';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationDataEntity } from '../registration-data.entity';
import { RegistrationViewEntity } from '../registration-view.entity';
import { RegistrationsService } from '../registrations.service';
import { RegistrationsPaginationService } from './registrations-pagination.service';
import { QueueMessageService } from '../../notifications/queue-message/queue-message.service';
import { MessageSizeType as MessageSizeTypeDto } from '../dto/message-size-type.dto';
import {
  MessageProcessType,
  MessageProcessTypeExtension,
} from '../../notifications/message-job.dto';
import {
  RegistrationScopedRepository,
  RegistrationViewScopedRepository,
} from '../registration-scoped.repository';
import { ScopedQueryBuilder, ScopedRepository } from '../../scoped.repository';
import { getScopedRepositoryProviderName } from '../../utils/scope/createScopedRepositoryProvider.helper';

@Injectable()
export class RegistrationsBulkService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TryWhatsappEntity)
  private readonly tryWhatsappRepository: Repository<TryWhatsappEntity>;
  @InjectRepository(PersonAffectedAppDataEntity)
  private readonly personAffectedAppDataRepository: Repository<PersonAffectedAppDataEntity>;
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
    paginateQuery = this.setQueryPropertiesBulkAction(paginateQuery);

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

    const registrationForUpdate =
      await this.registrationsPaginationService.getPaginate(
        paginateQuery,
        programId,
        false,
        true,
        this.getStatusUpdateBaseQuery(allowedCurrentStatuses),
      );
    const referenceIds = registrationForUpdate.data.map(
      (registration) => registration.referenceId,
    );
    if (!dryRun) {
      this.deleteBatch(referenceIds).catch((error) => {
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
    const chunkSize = 10000;
    paginateQuery = this.setQueryPropertiesBulkAction(
      paginateQuery,
      false,
      true,
    );
    const resultDto = await this.getBulkActionResult(
      paginateQuery,
      programId,
      this.getCustomMessageBaseQuery(),
    );

    if (!dryRun) {
      this.sendMessagesChunked(
        paginateQuery,
        programId,
        message,
        chunkSize,
        resultDto.applicableCount,
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
    message?: string,
    messageTemplateKey?: string,
    messageContentType?: MessageContentType,
    queryBuilder?: ScopedQueryBuilder<RegistrationViewEntity>,
  ): Promise<void> {
    const registrationForUpdate =
      await this.registrationsPaginationService.getPaginate(
        query,
        programId,
        false,
        true,
        queryBuilder,
      );
    const referenceIds = registrationForUpdate.data.map(
      (registration) => registration.referenceId,
    );
    await this.updateRegistrationStatusBatch(referenceIds, registrationStatus, {
      message,
      messageTemplateKey,
      messageContentType,
      bulkSize: registrationForUpdate.meta.totalItems,
    });
  }

  private async updateRegistrationStatusBatch(
    referenceIds: string[],
    registrationStatus: RegistrationStatusEnum,
    messageSizeType?: MessageSizeTypeDto,
  ): Promise<void> {
    let programId;
    let program;
    for (const referenceId of referenceIds) {
      const updatedRegistration =
        await this.registrationsService.setRegistrationStatus(
          referenceId,
          registrationStatus,
        );
      if (
        (messageSizeType.message || messageSizeType.messageTemplateKey) &&
        updatedRegistration
      ) {
        if (updatedRegistration.programId !== programId) {
          programId = updatedRegistration.programId;
          // avoid a query per PA if not necessary
          program = await this.programRepository.findOne({
            where: { id: programId },
          });
        }
        const messageProcessType =
          registrationStatus === RegistrationStatusEnum.invited &&
          program.tryWhatsAppFirst
            ? MessageProcessType.tryWhatsapp
            : MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric;
        try {
          await this.queueMessageService.addMessageToQueue(
            updatedRegistration,
            messageSizeType.message,
            messageSizeType.messageTemplateKey,
            messageSizeType.messageContentType,
            messageProcessType,
            null,
            null,
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

  private async deleteBatch(referenceIds: string[]): Promise<void> {
    // Do this first, so that error is already thrown if a PA cannot be changed to deleted, before removing any data below
    await this.checkAllowedStatusChangeOrThrow(
      referenceIds,
      RegistrationStatusEnum.deleted,
    );
    await this.updateRegistrationStatusBatch(
      referenceIds,
      RegistrationStatusEnum.deleted,
    );

    for await (const referenceId of referenceIds) {
      const registration =
        await this.registrationsService.getRegistrationFromReferenceId(
          referenceId,
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
  ): Promise<void> {
    for (const registration of registrations) {
      await this.queueMessageService.addMessageToQueue(
        registration,
        message,
        null,
        MessageContentType.custom,
        MessageProcessTypeExtension.smsOrWhatsappTemplateGeneric,
        null,
        null,
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
