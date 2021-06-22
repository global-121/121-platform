import { Injectable } from '@angular/core';
import { BulkActionId } from '../models/bulk-actions.models';
import { PaStatus, PersonRow } from '../models/person.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class BulkActionsService {
  constructor(private programsService: ProgramsServiceApiService) {}

  private onlyIds(people: PersonRow[]): string[] {
    return people.map((pa) => pa.referenceId);
  }

  private hasStatus(person: PersonRow, requiredStates: PaStatus[]): boolean {
    return requiredStates.includes(person.status);
  }

  public updateCheckbox(action: BulkActionId, personData: PersonRow) {
    switch (action) {
      case BulkActionId.invite:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.imported,
        ]);
        break;
      case BulkActionId.markNoLongerEligible:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.imported,
          PaStatus.invited,
        ]);
        break;
      case BulkActionId.selectForValidation:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.registered,
        ]);
        break;
      case BulkActionId.includeRunProgramRole:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
        ]);
        break;
      case BulkActionId.includePersonalDataRole:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
          PaStatus.rejected,
          PaStatus.inclusionEnded,
        ]);
        break;
      case BulkActionId.endInclusion:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.included,
        ]);
        break;
      case BulkActionId.reject:
        personData.checkboxVisible = this.hasStatus(personData, [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
          PaStatus.included,
          PaStatus.noLongerEligible,
          PaStatus.registeredWhileNoLongerEligible,
        ]);
        break;
    }
    return personData;
  }

  public async applyAction(
    action: BulkActionId,
    programId: number,
    selectedPeople: PersonRow[],
    message?: string,
  ): Promise<void> {
    switch (action) {
      case BulkActionId.invite:
        return await this.programsService.invite(
          programId,
          selectedPeople.map((pa) => pa.phoneNumber),
          message,
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
      case BulkActionId.includeRunProgramRole:
        return await this.programsService.include(
          programId,
          this.onlyIds(selectedPeople),
          message,
        );
      case BulkActionId.includePersonalDataRole:
        return await this.programsService.include(
          programId,
          this.onlyIds(selectedPeople),
          message,
        );
      case BulkActionId.endInclusion:
        return await this.programsService.end(
          programId,
          this.onlyIds(selectedPeople),
          message,
        );
      case BulkActionId.reject:
        return await this.programsService.reject(
          programId,
          this.onlyIds(selectedPeople),
          message,
        );
    }
  }
}
