import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { DataChangeActivity } from '@121-service/src/activities/interfaces/data-change-activity.interface';
import { FinancialServiceProviderChangeActivity } from '@121-service/src/activities/interfaces/financial-service-provider.interface';
import { MessageActivity } from '@121-service/src/activities/interfaces/message-activity.interface';
import { NoteActivity } from '@121-service/src/activities/interfaces/note-activity.interface';
import { StatusChangeActivity } from '@121-service/src/activities/interfaces/status-change-activity.interface';
import { TransactionActivity } from '@121-service/src/activities/interfaces/transaction-activity.interface';
import { Activity } from '@121-service/src/activities/types/activity.type';
import { GetEventDto } from '@121-service/src/events/dto/get-event.dto';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { EventsMapper } from '@121-service/src/events/utils/events.mapper';
import { findFinancialServiceProviderByNameOrFail } from '@121-service/src/financial-service-providers/financial-service-providers.helpers';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class ActivitiesMapper {
  static mergeAndMapToActivitiesDto({
    transactions,
    messages,
    notes,
    events,
    availableTypes,
  }: {
    transactions: GetAuditedTransactionDto[];
    messages: TwilioMessageEntity[];
    notes: NoteEntity[];
    events: EventEntity[];
    availableTypes: ActivityTypeEnum[];
  }): ActivitiesDto {
    const count: Partial<Record<ActivityTypeEnum, number>> = {};
    const activityLogItems: Activity[] = [];

    const { dataChanges, statusUpdates, financialServiceProviderChanges } =
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
        case ActivityTypeEnum.FinancialServiceProviderChange:
          activities = this.mapFinanacialServiceProviderChangesToActivity(
            financialServiceProviderChanges,
          );
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

  private static categoriseEvents(events: EventEntity[]) {
    const dataChanges: GetEventDto[] = [];
    const statusUpdates: GetEventDto[] = [];
    const financialServiceProviderChanges: GetEventDto[] = [];

    events.forEach((event) => {
      const mappedEvent = EventsMapper.mapEventToJsonDto(event);

      switch (event.type) {
        case EventEnum.registrationDataChange:
          dataChanges.push(mappedEvent);
          break;
        case EventEnum.registrationStatusChange:
          statusUpdates.push(mappedEvent);
          break;
        case EventEnum.financialServiceProviderChange:
          financialServiceProviderChanges.push(mappedEvent);
          break;
      }
    });

    return {
      dataChanges,
      statusUpdates,
      financialServiceProviderChanges,
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
        payment: transaction.payment,
        status: transaction.status,
        amount: transaction.amount,
        paymentDate: transaction.paymentDate,
        financialServiceProvider: findFinancialServiceProviderByNameOrFail(
          transaction.financialServiceProviderName,
        ),
        financialServiceProviderConfigurationLabel:
          transaction.financialServiceProviderConfigurationLabel,
        financialServiceProviderConfigurationName:
          transaction.programFinancialServiceProviderConfigurationName,
        errorMessage: transaction.errorMessage,
      },
    }));
  }
  private static mapMessagesToActivity(
    messages: TwilioMessageEntity[],
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
        from: message.from,
        to: message.to,
        body: message.body,
        status: message.status,
        mediaUrl: message.mediaUrl,
        contentType: message.contentType,
        errorCode: message.errorCode,
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
    events: GetEventDto[],
  ): DataChangeActivity[] {
    return events.map((event, index) => ({
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
    events: GetEventDto[],
  ): StatusChangeActivity[] {
    return events.map((event, index) => ({
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
      },
    }));
  }
  private static mapFinanacialServiceProviderChangesToActivity(
    events: GetEventDto[],
  ): FinancialServiceProviderChangeActivity[] {
    return events.map((event, index) => ({
      id: `${ActivityTypeEnum.FinancialServiceProviderChange}${index}`,
      user: {
        id: event.user?.id,
        username: event.user?.username,
      },
      created: event.created,
      type: ActivityTypeEnum.FinancialServiceProviderChange,
      attributes: {
        oldValue: event.attributes.oldValue,
        newValue: event.attributes.newValue,
        reason: event.attributes.reason,
      },
    }));
  }
}
