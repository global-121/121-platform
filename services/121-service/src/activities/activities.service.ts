import { Injectable } from '@nestjs/common';

import { ActivitiesMapper } from '@121-service/src/activities/activities.mapper';
import { EventScopedRepository } from '@121-service/src/events/event.repository';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { TwilioMessageScopedRepository } from '@121-service/src/notifications/twilio-message.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly eventScopedRepository: EventScopedRepository,
    private readonly twilioMessageScopedRepository: TwilioMessageScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly noteScopedRepository: NoteScopedRepository,
  ) {}
  async getByRegistrationIdAndProgramId(
    registrationId: number,
    programId: number,
  ) {
    const transactions =
      await this.transactionScopedRepository.getManyByRegistrationIdAndProgramId(
        registrationId,
        programId,
      );
    const messages =
      await this.twilioMessageScopedRepository.getManyByRegistrationId(
        registrationId,
      );
    const events =
      await this.eventScopedRepository.getManyByProgramIdAndSearchOptions(
        programId,
        {
          registrationId,
        },
      );
    const notes =
      await this.noteScopedRepository.getManyByRegistrationIdAndProgramId(
        registrationId,
        programId,
      );

    const mappedDto = ActivitiesMapper.mergeAndMapToActivitiesDto(
      transactions,
      messages,
      events,
      notes,
    );

    return mappedDto;
  }
}
