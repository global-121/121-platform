import { Injectable } from '@angular/core';
import RegistrationStatus from '../enums/registration-status.enum';
import { BulkActionId } from '../models/bulk-actions.models';
import { PersonRow } from '../models/person.model';
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
  constructor(private programsService: ProgramsServiceApiService) {}

  private onlyIds(people: PersonRow[]): string[] {
    return people.map((pa) => pa.referenceId);
  }

  private hasStatus(
    person: PersonRow,
    requiredStates: RegistrationStatus[],
  ): boolean {
    return requiredStates.includes(person.status);
  }

  public updateCheckbox(
    action: BulkActionId,
    personData: PersonRow,
    payment?: number,
  ) {
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
        personData.checkboxVisible = this.hasStatus(personData, [
          RegistrationStatus.registered,
          RegistrationStatus.selectedForValidation,
          RegistrationStatus.validated,
          RegistrationStatus.rejected,
          RegistrationStatus.inclusionEnded,
        ]);
        break;
      case BulkActionId.endInclusion:
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
        personData.checkboxVisible = personData.hasPhoneNumber;
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
          RegistrationStatus.included,
          RegistrationStatus.inclusionEnded,
          RegistrationStatus.rejected,
        ]);
        break;
      case BulkActionId.doPayment:
        personData.checkboxVisible =
          this.hasStatus(personData, [RegistrationStatus.included]) &&
          !personData.paymentHistory?.payments.includes(payment);
        break;
    }
    return personData;
  }

  public async applyAction(
    action: BulkActionId,
    programId: number,
    selectedPeople: PersonRow[],
    customBulkActionInput?: CustomBulkActionInput,
  ): Promise<void> {
    switch (action) {
      case BulkActionId.invite:
        return await this.programsService.invite(
          programId,
          this.onlyIds(selectedPeople),
          customBulkActionInput.message,
        );
      case BulkActionId.markNoLongerEligible:
        return await this.programsService.markNoLongerEligible(
          programId,
          this.onlyIds(selectedPeople),
        );
      case BulkActionId.selectForValidation:
        return await this.programsService.selectForValidation(
          programId,
          this.onlyIds(selectedPeople),
        );
      case BulkActionId.include:
        return await this.programsService.include(
          programId,
          this.onlyIds(selectedPeople),
          customBulkActionInput.message,
        );
      case BulkActionId.endInclusion:
        return await this.programsService.end(
          programId,
          this.onlyIds(selectedPeople),
          customBulkActionInput.message,
        );
      case BulkActionId.reject:
        return await this.programsService.reject(
          programId,
          this.onlyIds(selectedPeople),
          customBulkActionInput.message,
        );
      case BulkActionId.sendMessage:
        return await this.programsService.sendMessage(
          this.onlyIds(selectedPeople),
          customBulkActionInput.message,
          programId,
        );
      case BulkActionId.deletePa:
        return await this.programsService.deleteRegistrations(
          programId,
          this.onlyIds(selectedPeople),
        );
    }
  }
}
