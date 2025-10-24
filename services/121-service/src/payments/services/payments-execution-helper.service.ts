import { Injectable } from '@nestjs/common';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageContentDetails } from '@121-service/src/notifications/interfaces/message-content-details.interface';
import { MessageTemplateService } from '@121-service/src/notifications/message-template/message-template.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';

@Injectable()
export class PaymentsExecutionHelperService {
  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly programRepository: ProgramRepository,
    private readonly messageTemplateService: MessageTemplateService,
    private readonly registrationsBulkService: RegistrationsBulkService,
  ) {}

  /**
   * Updates payment count and sets status to completed if applicable
   */
  public async updatePaymentCountAndSetToCompleted({
    registrationIds,
    programId,
    userId,
  }: {
    registrationIds: number[];
    programId: number;
    userId: number;
  }): Promise<void> {
    // ##TODO: also move this here I think. Discuss.
    await this.registrationScopedRepository.increasePaymentCountByOne(
      registrationIds,
      2000,
    );

    await this.setStatusToCompletedIfApplicable(programId, userId);
  }

  /**
   * Checks program settings and completes registrations when applicable.
   * This mirrors the previous orchestration logic but has no external side-effects
   * beyond calling the registrationsBulkService to apply status changes and send messages.
   */
  public async setStatusToCompletedIfApplicable(
    programId: number,
    userId: number,
  ): Promise<void> {
    const program = await this.programRepository.findByIdOrFail(programId);
    if (!program.enableMaxPayments) {
      return;
    }

    const registrationsToComplete =
      await this.registrationScopedRepository.getRegistrationsToComplete(
        programId,
      );
    if (registrationsToComplete.length === 0) {
      return;
    }

    const isTemplateAvailable =
      await this.messageTemplateService.isTemplateAvailable(
        programId,
        RegistrationStatusEnum.completed,
      );
    const messageContentDetails: MessageContentDetails = isTemplateAvailable
      ? {
          messageTemplateKey: RegistrationStatusEnum.completed,
          messageContentType: MessageContentType.completed,
          message: '',
        }
      : {};

    await this.registrationsBulkService.applyRegistrationStatusChangeAndSendMessageByReferenceIds(
      {
        referenceIds: registrationsToComplete.map((r) => r.referenceId),
        programId,
        registrationStatus: RegistrationStatusEnum.completed,
        userId,
        messageContentDetails,
      },
    );
  }
}
