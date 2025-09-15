import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { DataChangeActivity } from '@121-service/src/activities/interfaces/data-change-activity.interface';
import { FspChangeActivity } from '@121-service/src/activities/interfaces/fsp-change.interface';
import { IgnoredDuplicateActivity } from '@121-service/src/activities/interfaces/ignored-duplicate-activity.interface';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { NoteActivity } from '@121-service/src/activities/interfaces/note-activity.interface';
import { StatusChangeActivity } from '@121-service/src/activities/interfaces/status-change-activity.interface';
import { TransactionActivity } from '@121-service/src/activities/interfaces/transaction-activity.interface';
import { Activity } from '@121-service/src/activities/types/activity.type';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { MessageByRegistrationId } from '@121-service/src/notifications/types/twilio-message-by-registration-id.interface';
import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { GetRegistrationEventDto } from '@121-service/src/registration-events/dto/get-registration-event.dto';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { RegistrationEventsMapper } from '@121-service/src/registration-events/utils/registration-events.mapper';

export class ActivitiesMapper {
  static mergeAndMapToActivitiesDto({
    transactions,
    messages,
    notes,
    events,
    availableTypes,
  }: {
    transactions: GetAuditedTransactionDto[];
    messages: MessageByRegistrationId[];
    notes: NoteEntity[];
    events: RegistrationEventEntity[];
    availableTypes: ActivityTypeEnum[];
  }): ActivitiesDto {
    const count: Partial<Record<ActivityTypeEnum, number>> = {};
    const activityLogItems: Activity[] = [];

    const { dataChanges, statusUpdates, fspChanges, ignoredDuplicates } =
      this.categoriseEvents(events);

    availableTypes.forEach((type) => {
      let activities: Activity[] = [];

      switch (type) {
        case ActivityTypeEnum.Transaction:
          activities = this.mapTransactionsToActivity(transactions);
          break;
        case ActivityTypeEnum.Message:
          activities = this.mapMessagesToActivity(messages);
          break;
        case ActivityTypeEnum.Note:
          activities = this.mapNotesToActivity(notes);
          break;
        case ActivityTypeEnum.DataChange:
          activities = this.mapDataChangesToActivity(dataChanges);
          break;
        case ActivityTypeEnum.StatusChange:
          activities = this.mapStatusUpdatesToActivity(statusUpdates);
          break;
        case ActivityTypeEnum.IgnoredDuplicate:
          activities = this.mapIgnoredDuplicatesToActivity(ignoredDuplicates);
          break;
        case ActivityTypeEnum.FspChange:
          activities =
            this.mapFinanacialServiceProviderChangesToActivity(fspChanges);
          break;
      }
      count[type] = activities.length;
      activityLogItems.push(...activities);
    });

    return {
      meta: { availableTypes, count },
      data: activityLogItems.sort((a, b) => (b.created > a.created ? 1 : -1)),
    };
  }

  private static categoriseEvents(
    registrationEvents: RegistrationEventEntity[],
  ) {
    const dataChanges: GetRegistrationEventDto[] = [];
    const statusUpdates: GetRegistrationEventDto[] = [];
    const fspChanges: GetRegistrationEventDto[] = [];
    const ignoredDuplicates: GetRegistrationEventDto[] = [];

    registrationEvents.forEach((registrationEvent) => {
      const mappedEvent =
        RegistrationEventsMapper.mapEventToJsonDto(registrationEvent);

      switch (registrationEvent.type) {
        case RegistrationEventEnum.registrationDataChange:
          dataChanges.push(mappedEvent);
          break;
        case RegistrationEventEnum.registrationStatusChange:
          statusUpdates.push(mappedEvent);
          break;
        case RegistrationEventEnum.fspChange:
          fspChanges.push(mappedEvent);
          break;
        case RegistrationEventEnum.ignoredDuplicate:
          ignoredDuplicates.push(mappedEvent);
          break;
      }
    });
    return {
      dataChanges,
      statusUpdates,
      fspChanges,
      ignoredDuplicates,
    };
  }

  private static mapTransactionsToActivity(
    transactions: GetAuditedTransactionDto[],
  ): TransactionActivity[] {
    return transactions.map((transaction, index) => ({
      id: `${ActivityTypeEnum.Transaction}${index}`,
      user: {
        id: transaction.userId,
        username: transaction.username,
      },
      created: transaction.paymentDate,
      type: ActivityTypeEnum.Transaction,
      attributes: {
        paymentId: transaction.paymentId,
        status: transaction.status,
        amount: transaction.amount,
        paymentDate: transaction.paymentDate,
        updatedDate: transaction.updated,
        fspName: transaction.fspName,
        fspConfigurationLabel: transaction.programFspConfigurationLabel,
        fspConfigurationName: transaction.programFspConfigurationName,
        errorMessage: transaction.errorMessage,
      },
    }));
  }
  private static mapMessagesToActivity(
    messages: MessageByRegistrationId[],
  ): MessageActivity[] {
    return messages.map((message, index) => ({
      id: `${ActivityTypeEnum.Message}${index}`,
      user: {
        id: message.userId,
        username: message.user.username ?? undefined,
      },
      created: message.created,
      type: ActivityTypeEnum.Message,
      attributes: {
        to: message.to,
        body: message.body,
        status: message.status,
        mediaUrl: message.mediaUrl,
        contentType: message.contentType,
        errorCode: message.errorCode,
        notificationType: message.type,
        transactionId: message.transactionId ?? undefined,
      },
    }));
  }
  private static mapNotesToActivity(notes: NoteEntity[]): NoteActivity[] {
    return notes.map((note, index) => ({
      id: `${ActivityTypeEnum.Note}${index}`,
      user: {
        id: note.userId,
        username: note.user.username ?? undefined,
      },
      created: note.created,
      type: ActivityTypeEnum.Note,
      attributes: {
        text: note.text,
      },
    }));
  }
  private static mapDataChangesToActivity(
    registrationEvents: GetRegistrationEventDto[],
  ): DataChangeActivity[] {
    return registrationEvents.map((event, index) => ({
      id: `${ActivityTypeEnum.DataChange}${index}`,
      user: {
        id: event.user?.id,
        username: event.user?.username,
      },
      created: event.created,
      type: ActivityTypeEnum.DataChange,
      attributes: {
        fieldName: event.attributes.fieldName,
        oldValue: event.attributes.oldValue,
        newValue: event.attributes.newValue,
        reason: event.attributes.reason,
      },
    }));
  }
  private static mapStatusUpdatesToActivity(
    registrationEvents: GetRegistrationEventDto[],
  ): StatusChangeActivity[] {
    return registrationEvents.map((event, index) => ({
      id: `${ActivityTypeEnum.StatusChange}${index}`,
      user: {
        id: event.user?.id,
        username: event.user?.username,
      },
      created: event.created,
      type: ActivityTypeEnum.StatusChange,
      attributes: {
        oldValue: event.attributes.oldValue as RegistrationStatusEnum,
        newValue: event.attributes.newValue as RegistrationStatusEnum,
        reason: event.attributes.reason,
      },
    }));
  }
  private static mapFinanacialServiceProviderChangesToActivity(
    registrationEvents: GetRegistrationEventDto[],
  ): FspChangeActivity[] {
    return registrationEvents.map((event, index) => ({
      id: `${ActivityTypeEnum.FspChange}${index}`,
      user: {
        id: event.user?.id,
        username: event.user?.username,
      },
      created: event.created,
      type: ActivityTypeEnum.FspChange,
      attributes: {
        oldValue: event.attributes.oldValue,
        newValue: event.attributes.newValue,
        reason: event.attributes.reason,
      },
    }));
  }
  private static mapIgnoredDuplicatesToActivity(
    registrationEvents: GetRegistrationEventDto[],
  ): IgnoredDuplicateActivity[] {
    return registrationEvents.map((event, index) => ({
      id: `${ActivityTypeEnum.IgnoredDuplicate}${index}`,
      user: {
        id: event.user?.id,
        username: event.user?.username,
      },
      created: event.created,
      type: ActivityTypeEnum.IgnoredDuplicate,
      attributes: {
        duplicateWithRegistrationId: Number(
          event.attributes.duplicateWithRegistrationId,
        ),
        duplicateWithRegistrationProgramId: Number(
          event.attributes.duplicateWithRegistrationProgramId,
        ),
        reason: event.attributes.reason,
      },
    }));
  }
}
