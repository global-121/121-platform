import { Injectable } from '@nestjs/common';

import { ActivitiesMapper } from '@121-service/src/activities/activities.mapper';
import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { NoteEntity } from '@121-service/src/notes/note.entity';
import { NoteScopedRepository } from '@121-service/src/notes/note.repository';
import { TwilioMessageScopedRepository } from '@121-service/src/notifications/twilio-message.repository';
import { MessageByRegistrationId } from '@121-service/src/notifications/types/twilio-message-by-registration-id.interface';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { GetAuditedTransactionViews } from '@121-service/src/payments/transactions/types/get-audited-tranaction-views.type';
import { PaginatedRegistrationEventDto } from '@121-service/src/registration-events/dto/paginated-registration-events.dto';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly registrationEventsService: RegistrationEventsService,
    private readonly twilioMessageScopedRepository: TwilioMessageScopedRepository,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
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

    let transactions: GetAuditedTransactionViews[] = [];
    let messages: MessageByRegistrationId[] = [];
    let events: PaginatedRegistrationEventDto[] = [];
    let notes: NoteEntity[] = [];

    const canViewPaymentData = await this.userService.canActivate(
      [PermissionEnum.PaymentREAD, PermissionEnum.PaymentTransactionREAD],
      programId,
      userId,
    );

    if (canViewPaymentData) {
      availableTypes.push(ActivityTypeEnum.Transaction);

      transactions =
        await this.transactionViewScopedRepository.getAuditedTransactionViews({
          registrationId,
          programId,
        });
    }

    const canViewMessageHistory = await this.userService.canActivate(
      [PermissionEnum.RegistrationNotificationREAD],
      programId,
      userId,
    );

    if (canViewMessageHistory) {
      availableTypes.push(ActivityTypeEnum.Message);

      messages =
        await this.twilioMessageScopedRepository.getManyByRegistrationId({
          registrationId,
          programId,
        });
    }

    const canViewPersonalData = await this.userService.canActivate(
      [PermissionEnum.RegistrationPersonalREAD],
      programId,
      userId,
    );

    if (canViewPersonalData) {
      availableTypes.push(ActivityTypeEnum.DataChange);
      availableTypes.push(ActivityTypeEnum.StatusChange);
      availableTypes.push(ActivityTypeEnum.FspChange);
      availableTypes.push(ActivityTypeEnum.IgnoredDuplicate);

      // ##TODO: it is a bit iffy that this now also uses the old method named 'Export'. We could use here instead the other endpoint, but it keeps coming back to make more sense if it's all one endpoint..
      events = (
        await this.registrationEventsService.getRegistrationEventsExport({
          programId,
          searchOptions: { registrationId },
        })
      ).data;

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
