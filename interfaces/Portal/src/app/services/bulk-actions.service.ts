import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Permission from '../auth/permission.enum';
import {
  BulkAction,
  BulkActionId,
  BulkActionResult,
} from '../models/bulk-actions.models';
import { ProgramPhase } from '../models/program.model';
import { PaginationFilter } from './filter.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

export class CustomBulkActionInput {
  message?: string;
  payment?: number;
  paymentAmount?: number;
  referenceId?: string;
  messageTemplateKey?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BulkActionsService {
  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  private bulkActions: BulkAction[] = [
    {
      id: BulkActionId.invite,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.invite}`,
      ),
      permissions: [Permission.RegistrationStatusInvitedUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        inputConstraint: {
          length: 20,
          type: 'min',
        },
      },
    },
    {
      id: BulkActionId.markNoLongerEligible,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.markNoLongerEligible}`,
      ),
      permissions: [Permission.RegistrationStatusNoLongerEligibleUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.selectForValidation,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.selectForValidation}`,
      ),
      permissions: [Permission.RegistrationStatusSelectedForValidationUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: false,
    },
    {
      id: BulkActionId.include,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.include}`,
      ),
      permissions: [Permission.RegistrationStatusIncludedUPDATE],
      phases: [ProgramPhase.inclusion, ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: false,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        inputConstraint: {
          length: 20,
          type: 'min',
        },
      },
    },
    {
      id: BulkActionId.reject,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.reject}`,
      ),
      permissions: [Permission.RegistrationStatusRejectedUPDATE],
      phases: [ProgramPhase.inclusion, ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: `${this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        )} <br> ${this.translate.instant(
          'page.program.program-people-affected.action-inputs.reject.explanation',
        )}`,
        inputConstraint: {
          length: 20,
          type: 'min',
        },
      },
    },
    {
      id: BulkActionId.endInclusion,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.endInclusion}`,
      ),
      permissions: [Permission.RegistrationStatusInclusionEndedUPDATE],
      phases: [ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        inputConstraint: {
          length: 20,
          type: 'min',
        },
      },
    },
    {
      id: BulkActionId.pause,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.pause}`,
      ),
      permissions: [Permission.RegistrationStatusPausedUPDATE],
      phases: [ProgramPhase.payment],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: false,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        inputConstraint: {
          length: 20,
          type: 'min',
        },
      },
    },
    {
      id: BulkActionId.sendMessage,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.sendMessage}`,
      ),
      permissions: [Permission.RegistrationNotificationCREATE],
      phases: [
        ProgramPhase.registrationValidation,
        ProgramPhase.inclusion,
        ProgramPhase.payment,
      ],
      showIfNoValidation: true,
      confirmConditions: {
        checkbox: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-checkbox',
        ),
        checkboxChecked: true,
        inputRequired: true,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.message-explanation',
        ),
        inputConstraint: {
          length: 20,
          type: 'min',
        },
      },
    },
    {
      id: BulkActionId.deletePa,
      enabled: false,
      label: this.translate.instant(
        `page.program.program-people-affected.actions.${BulkActionId.deletePa}`,
      ),
      permissions: [Permission.RegistrationDELETE],
      phases: [ProgramPhase.registrationValidation, ProgramPhase.inclusion],
      showIfNoValidation: true,
      confirmConditions: {
        inputRequired: false,
        explanation: this.translate.instant(
          'page.program.program-people-affected.action-inputs.delete-warning',
        ),
      },
    },
    {
      id: BulkActionId.divider,
      enabled: false,
      label: '-------------------------------',
      permissions: [Permission.PaymentCREATE],
      phases: [ProgramPhase.payment],
      showIfNoValidation: true,
    },
  ];

  public async applyAction(
    action: BulkActionId,
    programId: number,
    customBulkActionInput?: CustomBulkActionInput,
    dryRun = false,
    filters?: PaginationFilter[],
  ): Promise<BulkActionResult | void> {
    switch (action) {
      case BulkActionId.invite:
        return await this.programsService.invite(
          programId,
          customBulkActionInput?.message,
          dryRun,
          filters,
          customBulkActionInput?.messageTemplateKey,
        );
      case BulkActionId.markNoLongerEligible:
        return await this.programsService.markNoLongerEligible(
          programId,
          dryRun,
          filters,
        );
      case BulkActionId.selectForValidation:
        return await this.programsService.selectForValidation(
          programId,
          dryRun,
          filters,
        );
      case BulkActionId.include:
        return await this.programsService.include(
          programId,
          customBulkActionInput?.message,
          dryRun,
          filters,
          customBulkActionInput?.messageTemplateKey,
        );
      case BulkActionId.endInclusion:
        return await this.programsService.end(
          programId,
          customBulkActionInput?.message,
          dryRun,
          filters,
          customBulkActionInput?.messageTemplateKey,
        );
      case BulkActionId.reject:
        return await this.programsService.reject(
          programId,
          customBulkActionInput?.message,
          dryRun,
          filters,
          customBulkActionInput?.messageTemplateKey,
        );
      case BulkActionId.pause:
        return await this.programsService.pause(
          programId,
          customBulkActionInput?.message,
          dryRun,
          filters,
          customBulkActionInput?.messageTemplateKey,
        );
      case BulkActionId.doPayment:
        return await this.programsService.doPayment(
          programId,
          customBulkActionInput.payment,
          customBulkActionInput.paymentAmount,
          dryRun,
          filters,
        );
      case BulkActionId.sendMessage:
        return await this.programsService.sendMessage(
          programId,
          customBulkActionInput?.message,
          dryRun,
          filters,
        );
      case BulkActionId.deletePa:
        return await this.programsService.deleteRegistrations(
          programId,
          dryRun,
          filters,
        );
    }
  }

  public getBulkActions(): BulkAction[] {
    return this.bulkActions;
  }

  public generatePaymentBulkActions(
    paymentId: number,
    nextPaymentId: number,
  ): BulkAction[] {
    const paymentBulkActions: BulkAction[] = [];
    while (paymentId > nextPaymentId - 6 && paymentId > 0) {
      const paymentBulkAction = {
        id: BulkActionId.doPayment,
        enabled: true,
        label: `${this.translate.instant(
          `page.program.program-people-affected.actions.${BulkActionId.doPayment}`,
        )} #${paymentId}`,
        permissions: [Permission.PaymentCREATE],
        phases: [ProgramPhase.payment],
        showIfNoValidation: true,
      };
      paymentBulkActions.push(paymentBulkAction);
      paymentId--;
    }
    return paymentBulkActions;
  }
}
