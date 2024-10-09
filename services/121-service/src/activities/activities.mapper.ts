import { ActivitiesDto } from '@121-service/src/activities/dtos/activities.dto';
import { GetNotesDto } from '@121-service/src/notes/dto/get-notes.dto';
import { GetTwilioMessageDto } from '@121-service/src/notifications/dto/get-twilio-message.dto';
import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';

export class ActivitiesMapper {
  static mergeAndMapToActivitiesDto(
    transactions: GetAuditedTransactionDto[],
    messages: GetTwilioMessageDto[],
    // TODO: Change unknown to a dto when a solution is found for typing the joined tables
    events: unknown[],
    notes: GetNotesDto[],
  ): ActivitiesDto {
    console.log('🚀 ~ ActivitiesMapper ~ notes:', notes);
    console.log('🚀 ~ ActivitiesMapper ~ events:', events);
    console.log('🚀 ~ ActivitiesMapper ~ messages:', messages);
    console.log('🚀 ~ ActivitiesMapper ~ transactions:', transactions);
    return { meta: { availableTypes: [], count: {} }, data: [] };
  }

  private static mapTransactionsToData(_transactions: unknown[]): [] {
    return [];
  }
  private static mapMessagesToData(_messages: unknown[]): [] {
    return [];
  }
  private static mapEventsToData(_events: unknown[]): [] {
    return [];
  }
  private static mapNotesToData(_notes: unknown[]): [] {
    return [];
  }

  // static mapEventsToJsonDtos(events: EventEntity[]): GetEventDto[] {
  //   return events.map((event) => this.mapEventToJsonDto(event));
  // }

  // private static mapEventToJsonDto(event: EventEntity): GetEventDto {
  //   const attributes = this.createAttributesObject(event.attributes);
  //   return {
  //     id: event.id,
  //     created: event.created,
  //     user:
  //       event.user && event.user.username && event.userId
  //         ? { id: event.userId, username: event.user.username }
  //         : null,
  //     registrationId: event.registrationId,
  //     type: event.type,
  //     attributes,
  //   };
  // }

  // private static createAttributesObject(
  //   attributes: EventAttributeEntity[],
  // ): Record<string, EventAttributeEntity['value']> {
  //   const attributesObject: Record<string, EventAttributeEntity['value']> = {};
  //   for (const attribute of attributes) {
  //     if (attribute.value !== null) {
  //       attributesObject[attribute.key] = attribute.value;
  //     }
  //   }
  //   return attributesObject;
  // }
}
