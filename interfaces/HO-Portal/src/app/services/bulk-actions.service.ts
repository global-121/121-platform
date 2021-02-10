import { Injectable } from '@angular/core';
import { BulkActionId } from '../models/bulk-actions.models';
import { PaStatus, PersonRow } from '../models/person.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class BulkActionsService {
  constructor(private programsService: ProgramsServiceApiService) {}

  updateCheckbox(action: BulkActionId, personData: PersonRow) {
    switch (action) {
      case BulkActionId.selectForValidation:
        personData.checkboxVisible = [PaStatus.registered].includes(
          personData.status,
        );
        break;
      case BulkActionId.includeRunProgramRole:
        personData.checkboxVisible = [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
        ].includes(personData.status);
        break;
      case BulkActionId.includePersonalDataRole:
        personData.checkboxVisible = [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
          PaStatus.rejected,
        ].includes(personData.status);
        break;
      case BulkActionId.reject:
        personData.checkboxVisible = [PaStatus.included].includes(
          personData.status,
        );
        break;
      case BulkActionId.notifyIncluded:
        personData.checkboxVisible =
          [PaStatus.included].includes(personData.status) &&
          !personData.notifiedOfInclusion;
        break;
    }
    return personData;
  }

  async applyAction(
    action: BulkActionId,
    programId: number,
    selectedPeople: any[],
    message?: string,
  ): Promise<void> {
    switch (action) {
      case BulkActionId.selectForValidation:
        return await this.programsService.selectForValidation(
          programId,
          selectedPeople,
        );
      case BulkActionId.includeRunProgramRole:
        return await this.programsService.include(
          programId,
          selectedPeople,
          message,
        );
      case BulkActionId.includePersonalDataRole:
        return await this.programsService.include(
          programId,
          selectedPeople,
          message,
        );
      case BulkActionId.reject:
        return await this.programsService.reject(
          programId,
          selectedPeople,
          message,
        );
      case BulkActionId.notifyIncluded:
        return await this.programsService.notifySelectedIncluded(
          programId,
          selectedPeople,
        );
    }
  }
}
