import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { BulkActionId } from '../models/bulk-actions.models';
import { PersonRow, PaStatus } from '../models/person.model';

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
          PaStatus.excluded, // Update this to 'rejected' during 'reject PBI'
        ].includes(PaStatus[personData.status]);
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
    }
  }
}
