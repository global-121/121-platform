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
          PaStatus[personData.status],
        );
        break;
      case BulkActionId.includeProjectOfficer:
        personData.checkboxVisible = [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
        ].includes(PaStatus[personData.status]);
        break;
      case BulkActionId.includeProgramManager:
        personData.checkboxVisible = [
          PaStatus.registered,
          PaStatus.selectedForValidation,
          PaStatus.validated,
          PaStatus.rejected,
        ].includes(PaStatus[personData.status]);
        break;
      case BulkActionId.reject:
        personData.checkboxVisible = [PaStatus.included].includes(
          PaStatus[personData.status],
        );
        break;
      case BulkActionId.notifyIncluded:
        personData.checkboxVisible =
          [PaStatus.included].includes(PaStatus[personData.status]) &&
          !personData.notifiedOfInclusion;
        break;
    }
    return personData;
  }

  async applyAction(
    action: BulkActionId,
    programId: number,
    selectedPeople: any[],
  ): Promise<void> {
    switch (action) {
      case BulkActionId.selectForValidation:
        return await this.programsService.selectForValidation(
          programId,
          selectedPeople,
        );
      case BulkActionId.includeProjectOfficer:
        return await this.programsService.include(programId, selectedPeople);
      case BulkActionId.includeProgramManager:
        return await this.programsService.include(programId, selectedPeople);
      case BulkActionId.reject:
        return await this.programsService.reject(programId, selectedPeople);
      case BulkActionId.notifyIncluded:
        return await this.programsService.notifySelectedIncluded(
          programId,
          selectedPeople,
        );
    }
  }
}
