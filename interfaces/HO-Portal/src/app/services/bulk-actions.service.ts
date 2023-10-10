import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Permission from '../auth/permission.enum';
import RegistrationStatus from '../enums/registration-status.enum';
import { BulkAction, BulkActionId } from '../models/bulk-actions.models';
import { PersonRow } from '../models/person.model';
import { ProgramPhase } from '../models/program.model';
import { PaginationFilter } from './filter.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

class CustomBulkActionInput {
  message?: string;
  payment?: number;
  paymentAmount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BulkActionsService {
  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {}

  private onlyIds(people: PersonRow[]): string[] {
    return people.map((pa) => pa.referenceId);
  }

  private hasStatus(
    person: PersonRow,
    requiredStates: RegistrationStatus[],
  ): boolean {
    return requiredStates.includes(person.registrationStatus);
  }

  public updateCheckbox(
    action: BulkActionId,
    personData: PersonRow,
    hasSelectedPayment?: boolean,
  ) {
    console.log('personData: ', personData);
    switch (action) {
      case BulkActionId.invite:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.imported,
          RegistrationStatus.noLongerEligible,
        ]);
        break;
      case BulkActionId.markNoLongerEligible:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.imported,
          RegistrationStatus.invited,
        ]);
        break;
      case BulkActionId.selectForValidation:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.registered,
        ]);
        break;
      case BulkActionId.include:
        personData.checkboxVisible =
          this.hasStatus(personData, [
            RegistrationStatus.registered,
            RegistrationStatus.selectedForValidation,
            RegistrationStatus.validated,
            RegistrationStatus.rejected,
            RegistrationStatus.inclusionEnded,
            RegistrationStatus.paused,
            RegistrationStatus.completed,
          ]) &&
          (personData.paymentCountRemaining === null ||
            personData.paymentCountRemaining > 0);
        break;
      case BulkActionId.endInclusion:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.included,
          RegistrationStatus.completed,
        ]);
        break;
      case BulkActionId.pause:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.included,
        ]);
        break;
      case BulkActionId.reject:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.registered,
          RegistrationStatus.selectedForValidation,
          RegistrationStatus.validated,
          RegistrationStatus.included,
          RegistrationStatus.noLongerEligible,
          RegistrationStatus.registeredWhileNoLongerEligible,
        ]);
        break;
      case BulkActionId.sendMessage:
        personData.checkboxVisible = !!personData.phoneNumber;
        break;
      case BulkActionId.deletePa:
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.imported,
          RegistrationStatus.invited,
          RegistrationStatus.noLongerEligible,
          RegistrationStatus.startedRegistration,
          RegistrationStatus.registered,
          RegistrationStatus.selectedForValidation,
          RegistrationStatus.registeredWhileNoLongerEligible,
          RegistrationStatus.validated,
          RegistrationStatus.inclusionEnded,
          RegistrationStatus.rejected,
        ]);
        break;
      case BulkActionId.doPayment:
        personData.checkboxVisible =
          this.hasStatus(personData, [RegistrationStatus.included]) &&
          !hasSelectedPayment;
        break;
    }
    return personData;
  }

  private bulkActions: BulkAction[] = [
    {
      id: BulkActionId.invite,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.invite',
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
        'page.program.program-people-affected.actions.no-longer-eligible',
      ),
      permissions: [Permission.RegistrationStatusNoLongerEligibleUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: true,
    },
    {
      id: BulkActionId.selectForValidation,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.select-for-validation',
      ),
      permissions: [Permission.RegistrationStatusSelectedForValidationUPDATE],
      phases: [ProgramPhase.registrationValidation],
      showIfNoValidation: false,
    },
    {
      id: BulkActionId.include,
      enabled: false,
      label: this.translate.instant(
        'page.program.program-people-affected.actions.include',
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
        'page.program.program-people-affected.actions.reject',
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
        'page.program.program-people-affected.actions.end-inclusion',
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
        'page.program.program-people-affected.actions.pause',
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
        'page.program.program-people-affected.actions.send-message',
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
        'page.program.program-people-affected.actions.delete-pa',
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
    selectedPeople: PersonRow[],
    customBulkActionInput?: CustomBulkActionInput,
    dryRun: boolean = false,
    filters?: PaginationFilter[],
  ): Promise<void> {
    switch (action) {
      case BulkActionId.invite:
        return await this.programsService.invite(
          programId,
          customBulkActionInput.message,
          dryRun,
          filters,
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
          customBulkActionInput.message,
          dryRun,
          filters,
        );
      case BulkActionId.endInclusion:
        return await this.programsService.end(
          programId,
          customBulkActionInput.message,
          dryRun,
          filters,
        );
      case BulkActionId.reject:
        return await this.programsService.reject(
          programId,
          customBulkActionInput.message,
          dryRun,
          filters,
        );
      case BulkActionId.pause:
        return await this.programsService.pause(
          programId,
          customBulkActionInput.message,
          dryRun,
          filters,
        );
      case BulkActionId.sendMessage:
        return await this.programsService.sendMessage(
          programId,
          customBulkActionInput.message,
          dryRun,
          filters,
        );
      case BulkActionId.deletePa:
        return await this.programsService.deleteRegistrations(
          programId,
          this.onlyIds(selectedPeople),
        );
    }
  }

  public getBulkActions(): BulkAction[] {
    return this.bulkActions;
  }
}
