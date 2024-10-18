import { Injectable } from '@nestjs/common';

import { ActivitiesMapper } from '@121-service/src/activities/activities.mapper';
import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { EventEntity } from '@121-service/src/events/entities/event.entity';
import { EventScopedRepository } from '@121-service/src/events/event.repository';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { TwilioMessageEntity } from '@121-service/src/notifications/twilio.entity';
import { TwilioMessageScopedRepository } from '@121-service/src/notifications/twilio-message.repository';
import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly eventScopedRepository: EventScopedRepository,
    private readonly twilioMessageScopedRepository: TwilioMessageScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly noteScopedRepository: NoteScopedRepository,
    private readonly userService: UserService,
  ) {}
  async getByRegistrationIdAndProgramId({
    registrationId,
    programId,
    userId,
  }: {
    registrationId: number;
    programId: number;
    userId: number;
  }) {
    const availableTypes: ActivityTypeEnum[] = [];

    let transactions: GetAuditedTransactionDto[] = [];
    let messages: TwilioMessageEntity[] = [];
    let events: EventEntity[] = [];
    let notes: NoteEntity[] = [];

    const canViewPaymentData = await this.userService.canActivate(
      [PermissionEnum.PaymentREAD, PermissionEnum.PaymentTransactionREAD],
      programId,
      userId,
    );

    if (canViewPaymentData) {
      availableTypes.push(ActivityTypeEnum.Transaction);

      transactions =
        await this.transactionScopedRepository.getManyByRegistrationIdAndProgramId(
          registrationId,
          programId,
        );
    }

    const canViewMessageHistory = await this.userService.canActivate(
      [PermissionEnum.RegistrationNotificationREAD],
      programId,
      userId,
    );

    if (canViewMessageHistory) {
      availableTypes.push(ActivityTypeEnum.Message);

      messages =
        await this.twilioMessageScopedRepository.getManyByRegistrationId(
          registrationId,
        );
    }

    const canViewPersonalData = await this.userService.canActivate(
      [PermissionEnum.RegistrationPersonalREAD],
      programId,
      userId,
    );

    if (canViewPersonalData) {
      availableTypes.push(ActivityTypeEnum.DataChange);
      availableTypes.push(ActivityTypeEnum.StatusChange);
      availableTypes.push(ActivityTypeEnum.FinancialServiceProviderChange);

      events =
        await this.eventScopedRepository.getManyByProgramIdAndSearchOptions(
          programId,
          {
            registrationId,
          },
        );

      availableTypes.push(ActivityTypeEnum.Note);

      notes =
        await this.noteScopedRepository.getManyByRegistrationIdAndProgramId(
          registrationId,
          programId,
        );
    }

    const mappedDto = ActivitiesMapper.mergeAndMapToActivitiesDto({
      transactions,
      messages,
      events,
      notes,
      availableTypes,
    });

    return mappedDto;
  }
}
