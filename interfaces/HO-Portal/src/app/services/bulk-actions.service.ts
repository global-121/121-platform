import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { BulkActionId } from './bulk-actions.models';
import { Person } from '../models/person.model';

@Injectable({
  providedIn: 'root',
})
export class BulkActionsService {
  constructor(private programsService: ProgramsServiceApiService) {}

  updateCheckboxes(action: BulkActionId, personData: Person) {
    switch (action) {
      case BulkActionId.selectForValidation:
        personData.checkboxVisible =
          personData.tempScore && !personData.selectedForValidation
            ? true
            : false;
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
    }
  }
}
