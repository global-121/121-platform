import { Injectable } from '@nestjs/common';

import { ActivitiesMapper } from '@121-service/src/activities/activities.mapper';
import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { TwilioMessageScopedRepository } from '@121-service/src/notifications/twilio-message.repository';
import { MessageByRegistrationId } from '@121-service/src/notifications/types/twilio-message-by-registration-id.interface';
import { GetAuditedTransactionDto } from '@121-service/src/payments/transactions/dto/get-audited-transaction.dto';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { RegistrationEventEntity } from '@121-service/src/registration-events/entities/registration-event.entity';
import { RegistrationEventScopedRepository } from '@121-service/src/registration-events/registration-event.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly eventScopedRepository: RegistrationEventScopedRepository,
    private readonly twilioMessageScopedRepository: TwilioMessageScopedRepository,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly noteScopedRepository: NoteScopedRepository,
    private readonly userService: UserService,
  ) {}
  async getByRegistrationIdAndProjectId({
    registrationId,
    projectId,
    userId,
  }: {
    registrationId: number;
    projectId: number;
    userId: number;
  }) {
    const availableTypes: ActivityTypeEnum[] = [];

    let transactions: GetAuditedTransactionDto[] = [];
    let messages: MessageByRegistrationId[] = [];
    let events: RegistrationEventEntity[] = [];
    let notes: NoteEntity[] = [];

    const canViewPaymentData = await this.userService.canActivate(
      [PermissionEnum.PaymentREAD, PermissionEnum.PaymentTransactionREAD],
      projectId,
      userId,
    );

    if (canViewPaymentData) {
      availableTypes.push(ActivityTypeEnum.Transaction);

      transactions =
        await this.transactionScopedRepository.getLatestTransactionsByRegistrationIdAndProjectId(
          registrationId,
          projectId,
        );
    }

    const canViewMessageHistory = await this.userService.canActivate(
      [PermissionEnum.RegistrationNotificationREAD],
      projectId,
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
      projectId,
      userId,
    );

    if (canViewPersonalData) {
      availableTypes.push(ActivityTypeEnum.DataChange);
      availableTypes.push(ActivityTypeEnum.StatusChange);
      availableTypes.push(ActivityTypeEnum.FspChange);
      availableTypes.push(ActivityTypeEnum.IgnoredDuplicate);

      events =
        await this.eventScopedRepository.getManyByProjectIdAndSearchOptions(
          projectId,
          {
            registrationId,
          },
        );

      availableTypes.push(ActivityTypeEnum.Note);

      notes =
        await this.noteScopedRepository.getManyByRegistrationIdAndProjectId(
          registrationId,
          projectId,
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
