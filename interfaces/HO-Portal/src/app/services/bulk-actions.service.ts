import { Injectable } from '@angular/core';
import { BulkAction } from '../models/program.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root'
})
export class BulkActionsService {

  constructor(
    private programsService: ProgramsServiceApiService
  ) {
  }

  updateCheckboxes(action: BulkAction, personData: any) {
    if (action === BulkAction.selectForValidation) {
      personData.checkboxVisible = personData.tempScore && !personData.selectedForValidation ? true : false;
    }
    return personData;
  }

  async applyAction(action: BulkAction, programId: number, selectedPeople: any[]) {
    if (action === BulkAction.selectForValidation) {
      await this.programsService.selectForValidation(programId, selectedPeople);
    }
  }
}
